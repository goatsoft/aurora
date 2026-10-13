/**
 * Shareable links carry the whole document in the URL hash, deflated and base64url-encoded, so
 * sharing needs no server. `#a=` marks the format, leaving room for others later.
 */
const PREFIX = 'a='

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  return new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream)).arrayBuffer())
}

const toBase64Url = (bytes: Uint8Array) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (text: string) => {
  const s = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

/** The URL hash (without `#`) for a document. */
export async function encodeShare(doc: object): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(doc))
  return PREFIX + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))
}

/** The document in a URL hash, or undefined if the hash isn't a Studio link (or is damaged). */
export async function decodeShare(hash: string): Promise<unknown> {
  const body = hash.replace(/^#/, '')
  if (!body.startsWith(PREFIX)) return undefined
  try {
    const json = await pipe(fromBase64Url(body.slice(PREFIX.length)), new DecompressionStream('deflate-raw'))
    return JSON.parse(new TextDecoder().decode(json)) as unknown
  } catch {
    return undefined
  }
}
