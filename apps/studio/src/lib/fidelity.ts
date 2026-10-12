import { compileCss } from '@goatsoft/aurora'
import { renderFrame } from '@goatsoft/aurora/poster'
import { deltaEOK, gamutMap, parseColor, rgbToOklab } from '@goatsoft/color'
import type { AuroraDocument } from '@goatsoft/aurora-format'

const W = 96
const H = 54
/** ΔE-OK at which a pixel counts as fully different; 0.02 is just noticeable. */
const FAR = 0.15

/** Rasterises the CSS fallback exactly as a browser paints it, via an SVG foreignObject. */
async function cssPixels(doc: AuroraDocument, page: string): Promise<Uint8ClampedArray> {
  const css = compileCss(doc)
  // The fallback layer overscans by 10% each side (it drifts); match the frame it shows at rest.
  const style = `position:absolute;left:-10%;top:-10%;width:120%;height:120%;${css.style}`.replace(/"/g, '&quot;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${page}"><div style="${style}"></div></div></foreignObject></svg>`
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await image.decode()
  const canvas = new OffscreenCanvas(W, H)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0)
  return ctx.getImageData(0, 0, W, H).data
}

/**
 * How closely the CSS fallback matches the WebGPU render, 0–100: the mean perceptual (ΔE-OK)
 * difference between the two at rest, both over the page colour. Undefined without WebGPU.
 */
export async function fidelity(doc: AuroraDocument, page: string): Promise<number | undefined> {
  const parsed = parseColor(page)
  if (!parsed.ok) throw new Error(`fidelity(): the page colour ${parsed.message}`)
  const bg = gamutMap(parsed.color)
  if (!('gpu' in navigator)) return undefined
  let gpu: Uint8ClampedArray
  try {
    gpu = await renderFrame(doc, { width: W, height: H, time: 0 })
  } catch {
    return undefined
  }
  const css = await cssPixels(doc, page)
  const [pr, pg, pb] = [bg.r * 255, bg.g * 255, bg.b * 255]
  let total = 0
  for (let i = 0; i < gpu.length; i += 4) {
    const a = gpu[i + 3]! / 255
    const over = (k: number, p: number) => (gpu[i + k]! * a + p * (1 - a)) / 255
    const x = rgbToOklab({ r: over(0, pr), g: over(1, pg), b: over(2, pb), alpha: 1 })
    const y = rgbToOklab({ r: css[i]! / 255, g: css[i + 1]! / 255, b: css[i + 2]! / 255, alpha: 1 })
    total += Math.min(1, deltaEOK(x, y) / FAR)
  }
  return Math.round(100 * (1 - total / (W * H)))
}
