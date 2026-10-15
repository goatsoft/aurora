import type { Oklab, RgbSpace } from './oklab'
import { gamutMap, inGamut, oklchToOklab, rgbToOklab } from './oklab'
import { srgbToLinear } from './oklab'

/** WCAG 2 relative luminance of a colour as displayed in sRGB (gamut-mapped first). */
export function luminance(color: Oklab): number {
  const { r, g, b } = gamutMap(color)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

/** WCAG 2 contrast between opaque colours, from 1 to 21. Ignores alpha; use contrastOn for translucent colours. AA body text needs 4.5. */
export function contrastRatio(x: Oklab, y: Oklab): number {
  const [hi, lo] = [luminance(x), luminance(y)].sort((a, b) => b - a) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** CSS source-over compositing in gamma-encoded RGB. Returns OKLab; the default display space is sRGB. */
export function compositeOver(foreground: Oklab, background: Oklab, space: RgbSpace = 'srgb'): Oklab {
  const front = gamutMap(foreground, space)
  const back = gamutMap(background, space)
  const remaining = back.alpha * (1 - front.alpha)
  const alpha = front.alpha + remaining
  if (alpha === 0) return { l: 0, a: 0, b: 0, alpha: 0 }
  return rgbToOklab({
    r: (front.r * front.alpha + back.r * remaining) / alpha,
    g: (front.g * front.alpha + back.g * remaining) / alpha,
    b: (front.b * front.alpha + back.b * remaining) / alpha,
    alpha,
  }, space)
}

/** WCAG 2 contrast of foreground over background, composited onto a known opaque sRGB canvas. */
export function contrastOn(foreground: Oklab, background: Oklab, canvas: Oklab): number {
  if (canvas.alpha !== 1) throw new RangeError('contrastOn requires an opaque canvas colour.')
  const surface = compositeOver(background, canvas)
  return contrastRatio(compositeOver(foreground, surface), surface)
}

/**
 * The most chroma a lightness and hue can have inside an RGB gamut: the gamut's boundary, as
 * colour pickers draw it. Lightness 0 and 1 have none.
 */
export function maxChroma(l: number, h: number, space: RgbSpace = 'srgb'): number {
  if (l <= 0 || l >= 1) return 0
  let min = 0
  let max = 0.5
  for (let i = 0; i < 24; i++) {
    const c = (min + max) / 2
    if (inGamut(oklchToOklab({ l, c, h, alpha: 1 }), space)) min = c
    else max = c
  }
  return min
}
