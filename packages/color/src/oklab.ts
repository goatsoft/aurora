/**
 * OKLab / OKLCH colour maths, after Björn Ottosson (https://bottosson.github.io/posts/oklab/).
 * RGB spaces share the D65 white point; gamut mapping follows CSS Color 4 §13.2.
 */

/** OKLab colour. `l` is 0–1; `a` and `b` are roughly ±0.4. `alpha` is 0–1. */
export interface Oklab {
  l: number
  a: number
  b: number
  alpha: number
}

/** OKLCH colour. `c` is chroma (0 to roughly 0.4), `h` is hue in degrees, 0–360. */
export interface Oklch {
  l: number
  c: number
  h: number
  alpha: number
}

/** Gamma-encoded RGB with channels in 0–1 (unclamped until gamut-mapped). */
export interface Rgb {
  r: number
  g: number
  b: number
  alpha: number
}

export type RgbSpace = 'srgb' | 'display-p3'

type Vec3 = readonly [number, number, number]
type Mat3 = readonly [Vec3, Vec3, Vec3]

const mul = (m: Mat3, [x, y, z]: Vec3): Vec3 => [
  m[0][0] * x + m[0][1] * y + m[0][2] * z,
  m[1][0] * x + m[1][1] * y + m[1][2] * z,
  m[2][0] * x + m[2][1] * y + m[2][2] * z,
]

const LINEAR_SRGB_TO_LMS: Mat3 = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
]
const LMS_TO_OKLAB: Mat3 = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
]
const OKLAB_TO_LMS: Mat3 = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.291485548],
]
const LMS_TO_LINEAR_SRGB: Mat3 = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
]
const LINEAR_P3_TO_LINEAR_SRGB: Mat3 = [
  [1.2249401762805598, -0.22494017628055996, 0],
  [-0.04205695470968816, 1.0420569547096881, 0],
  [-0.019637554590334432, -0.07863604555063188, 1.0982736001409663],
]
const LINEAR_SRGB_TO_LINEAR_P3: Mat3 = [
  [0.8224619687143623, 0.17753803128563775, 0],
  [0.033194198850968, 0.9668058011490319, 0],
  [0.01708263023566388, 0.0723974405834286, 0.9105199291809074],
]

/** sRGB (and Display P3) transfer function, decode. Sign-preserving so out-of-gamut values survive. */
export function srgbToLinear(c: number): number {
  const abs = Math.abs(c)
  return abs <= 0.04045 ? c / 12.92 : Math.sign(c) * ((abs + 0.055) / 1.055) ** 2.4
}

/** sRGB (and Display P3) transfer function, encode. */
export function linearToSrgb(c: number): number {
  const abs = Math.abs(c)
  return abs <= 0.0031308 ? c * 12.92 : Math.sign(c) * (1.055 * abs ** (1 / 2.4) - 0.055)
}

export function rgbToOklab({ r, g, b, alpha }: Rgb, space: RgbSpace = 'srgb'): Oklab {
  let linear: Vec3 = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)]
  if (space === 'display-p3') linear = mul(LINEAR_P3_TO_LINEAR_SRGB, linear)
  const lms = mul(LINEAR_SRGB_TO_LMS, linear).map(Math.cbrt) as unknown as Vec3
  const [l, a, bb] = mul(LMS_TO_OKLAB, lms)
  return { l, a, b: bb, alpha }
}

/** Converts to RGB without gamut mapping: channels may fall outside 0–1. */
export function oklabToRgb({ l, a, b, alpha }: Oklab, space: RgbSpace = 'srgb'): Rgb {
  const lms = mul(OKLAB_TO_LMS, [l, a, b]).map((v) => v ** 3) as unknown as Vec3
  let linear = mul(LMS_TO_LINEAR_SRGB, lms)
  if (space === 'display-p3') linear = mul(LINEAR_SRGB_TO_LINEAR_P3, linear)
  return { r: linearToSrgb(linear[0]), g: linearToSrgb(linear[1]), b: linearToSrgb(linear[2]), alpha }
}

/** Chroma below this is treated as achromatic, and its hue reported as 0. */
const ACHROMATIC = 1e-7

export function oklabToOklch({ l, a, b, alpha }: Oklab): Oklch {
  const c = Math.hypot(a, b)
  const h = c < ACHROMATIC ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
  return { l, c, h, alpha }
}

export function oklchToOklab({ l, c, h, alpha }: Oklch): Oklab {
  const rad = (h * Math.PI) / 180
  return { l, a: c * Math.cos(rad), b: c * Math.sin(rad), alpha }
}

/** Euclidean distance in OKLab (ΔE-OK). About 0.02 is the just-noticeable difference. */
export function deltaEOK(x: Oklab, y: Oklab): number {
  return Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b)
}

const GAMUT_EPSILON = 1e-5

export function inGamut(color: Oklab, space: RgbSpace = 'srgb'): boolean {
  const { r, g, b } = oklabToRgb(color, space)
  return [r, g, b].every((v) => v >= -GAMUT_EPSILON && v <= 1 + GAMUT_EPSILON)
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function clip(color: Oklab, space: RgbSpace): Rgb {
  const { r, g, b, alpha } = oklabToRgb(color, space)
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b), alpha }
}

const JND = 0.02
const CHROMA_EPSILON = 1e-4

/**
 * Maps a colour into an RGB gamut by reducing OKLCH chroma at constant lightness and hue
 * (CSS Color 4 §13.2). The result is perceptually as close to the original as the gamut allows,
 * so vivid colours stay vivid instead of clipping to a different hue.
 */
export function gamutMap(color: Oklab, space: RgbSpace = 'srgb'): Rgb {
  const lch = oklabToOklch(color)
  if (lch.l >= 1) return { r: 1, g: 1, b: 1, alpha: color.alpha }
  if (lch.l <= 0) return { r: 0, g: 0, b: 0, alpha: color.alpha }
  if (inGamut(color, space)) return clip(color, space)

  let clipped = clip(color, space)
  if (deltaEOK(rgbToOklab(clipped, space), color) < JND) return clipped

  let min = 0
  let max = lch.c
  let minInGamut = true
  while (max - min > CHROMA_EPSILON) {
    const chroma = (min + max) / 2
    const current = oklchToOklab({ ...lch, c: chroma })
    if (minInGamut && inGamut(current, space)) {
      min = chroma
      continue
    }
    clipped = clip(current, space)
    const error = deltaEOK(rgbToOklab(clipped, space), current)
    if (error < JND) {
      if (JND - error < CHROMA_EPSILON) return clipped
      minInGamut = false
      min = chroma
    } else {
      max = chroma
    }
  }
  return clipped
}
