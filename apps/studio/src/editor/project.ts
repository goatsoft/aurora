/**
 * Dev-tool mode: Studio connected to a project through the unplugin's dev server or
 * `npx aurora studio`. The link carries the API address and a session token.
 */
export interface Connection {
  api: string
  token: string
}

const KEY = 'aurora-studio-connection'

/** sessionStorage, where it exists and is allowed (it throws in some privacy modes). */
function session(): Storage | undefined {
  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}

/** Reads a connection from the URL (then drops the token from the address bar) or from this tab's session. */
export function takeConnection(): Connection | undefined {
  const url = new URL(location.href)
  const api = url.searchParams.get('connect')
  const token = url.searchParams.get('token')
  if (api && token) {
    url.searchParams.delete('connect')
    url.searchParams.delete('token')
    history.replaceState(null, '', url)
    const connection = { api: api.endsWith('/') ? api : `${api}/`, token }
    session()?.setItem(KEY, JSON.stringify(connection))
    return connection
  }
  const saved = session()?.getItem(KEY)
  return saved ? JSON.parse(saved) as Connection : undefined
}

export function forgetConnection(): void {
  session()?.removeItem(KEY)
}

async function request<T>(c: Connection, path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    const headers = new Headers(init.headers)
    headers.set('x-aurora-token', c.token)
    res = await fetch(new URL(path, c.api), { ...init, headers })
  } catch {
    throw new Error(`Can't reach your project at ${c.api}. Is the dev server (or aurora studio) still running?`)
  }
  const body = await res.json() as T & { error?: string, issues?: { path: string, message: string }[] }
  if (!res.ok) {
    const first = body.issues?.[0]
    throw new Error(first ? `${body.error ?? 'Not saved'} ${first.path} ${first.message}` : body.error ?? `Request failed (${res.status}).`)
  }
  return body
}

export const projectApi = {
  files: (c: Connection) => request<{ root: string, files: string[] }>(c, 'files'),
  read: (c: Connection, path: string) => request<{ text: string }>(c, `file?path=${encodeURIComponent(path)}`).then((r) => r.text),
  write: (c: Connection, path: string, text: string) => request<{ saved: true }>(c, `file?path=${encodeURIComponent(path)}`, { method: 'PUT', body: text, headers: { 'content-type': 'application/json' } }),
}
