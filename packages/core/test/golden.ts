import { commands } from 'vitest/browser'
import { expect, inject } from 'vitest'

/**
 * Golden images: PNGs under packages/core/test/golden, rendered on the SwiftShader adapter, so
 * every generator's look is reviewable in the repo and any change to it shows up in a diff.
 * Regenerate with `UPDATE_GOLDEN=1 pnpm test:browser`. CI fails on a missing golden.
 */
const DIR = 'packages/core/test/golden'

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff
  for (const b of bytes) c = CRC[(c ^ b) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  return new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream)).arrayBuffer())
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  out.set(Array.from(type, (c) => c.charCodeAt(0)), 4)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

/** RGBA8 → PNG (no row filters; zlib via CompressionStream). */
export async function encodePng(rgba: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  const header = new Uint8Array(13)
  const view = new DataView(header.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  header.set([8, 6, 0, 0, 0], 8)
  const raw = new Uint8Array((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1)
  const parts = [new Uint8Array(SIGNATURE), chunk('IHDR', header), chunk('IDAT', await pipe(raw, new CompressionStream('deflate'))), chunk('IEND', new Uint8Array())]
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

/** PNG written by encodePng → RGBA8. */
export async function decodePng(png: Uint8Array): Promise<{ rgba: Uint8Array, width: number, height: number }> {
  const view = new DataView(png.buffer, png.byteOffset)
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  const idat: Uint8Array[] = []
  for (let offset = 8; offset < png.length;) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8))
    if (type === 'IDAT') idat.push(png.subarray(offset + 8, offset + 8 + length))
    offset += 12 + length
  }
  const raw = await pipe(new Uint8Array(idat.flatMap((part) => [...part])), new DecompressionStream('deflate'))
  const rgba = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) rgba.set(raw.subarray(y * (width * 4 + 1) + 1, (y + 1) * (width * 4 + 1)), y * width * 4)
  return { rgba, width, height }
}

const toBase64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

/**
 * Compares a render with its golden image: at most 0.5% of pixels may differ by more than 2/255
 * in any channel. On a mismatch the render is written next to it as `<name>.actual.png`.
 */
export async function expectGolden(name: string, rgba: Uint8Array, width: number, height: number): Promise<void> {
  const file = `${DIR}/${name}.png`
  const png = await encodePng(rgba, width, height)
  let golden: string | undefined
  try {
    golden = await commands.readFile(file, 'base64')
  } catch {
    golden = undefined
  }
  if (inject('updateGolden') || golden === undefined) {
    expect(golden === undefined && inject('ci'), `golden ${file} is missing; run UPDATE_GOLDEN=1 pnpm test:browser and commit it`).toBe(false)
    await commands.writeFile(file, toBase64(png), 'base64')
    return
  }
  const expected = await decodePng(fromBase64(golden))
  expect([expected.width, expected.height], `${name} size`).toEqual([width, height])
  let changed = 0
  for (let i = 0; i < rgba.length; i += 4) {
    for (let k = 0; k < 4; k++) {
      if (Math.abs(rgba[i + k]! - expected.rgba[i + k]!) > 2) {
        changed++
        break
      }
    }
  }
  const fraction = changed / (width * height)
  if (fraction > 0.005) await commands.writeFile(`${DIR}/${name}.actual.png`, toBase64(png), 'base64')
  expect(fraction, `${name}: ${(fraction * 100).toFixed(2)}% of pixels differ from ${file} (see ${name}.actual.png)`).toBeLessThanOrEqual(0.005)
}
