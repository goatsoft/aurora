import { gamutMap, inGamut, oklchToOklab } from './oklab'
import type { Oklab, RgbSpace } from './oklab'
import { srgbToLinear } from './oklab'

/** WCAG 2 relative luminance of a colour as displayed in sRGB (gamut-mapped first). */
export function luminance(color: Oklab): number {
  const { r, g, b } = gamutMap(color)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

/** WCAG 2 contrast ratio between two colours, from 1 (identical) to 21 (black on white). AA body text needs 4.5. */
export function contrastRatio(x: Oklab, y: Oklab): number {
  const [hi, lo] = [luminance(x), luminance(y)].sort((a, b) => b - a) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
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
