import type { Oklab, RgbSpace } from '@/index'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  deltaEOK,
  gamutMap,
  inGamut,
  linearToSrgb,
  oklabToOklch,
  oklabToRgb,
  oklchToOklab,
  rgbToOklab,
  srgbToLinear,
} from '@/index'

const unit = fc.double({ min: 0, max: 1, noNaN: true })
const rgb = fc.record({ r: unit, g: unit, b: unit, alpha: unit })
const space = fc.constantFrom<RgbSpace>('srgb', 'display-p3')
const oklch = fc.record({
  l: fc.double({ min: 0.01, max: 0.99, noNaN: true }),
  c: fc.double({ min: 0, max: 0.4, noNaN: true }),
  h: fc.double({ min: 0, max: 359.999, noNaN: true }),
  alpha: unit,
})

describe('transfer functions', () => {
  it('use the linear segment near black', () => {
    expect(srgbToLinear(0.04)).toBeCloseTo(0.04 / 12.92, 12)
    expect(linearToSrgb(0.003)).toBeCloseTo(0.003 * 12.92, 12)
  })

  it('preserve sign for out-of-gamut values', () => {
    expect(srgbToLinear(-0.5)).toBeCloseTo(-srgbToLinear(0.5), 12)
    expect(linearToSrgb(-0.5)).toBeCloseTo(-linearToSrgb(0.5), 12)
  })

  it('round-trip', () => {
    fc.assert(fc.property(unit, (c) => Math.abs(linearToSrgb(srgbToLinear(c)) - c) < 1e-12))
  })
})

describe('OKLab', () => {
  // Reference values from Björn Ottosson's post and CSS Color 4.
  it('matches reference values', () => {
    const white = rgbToOklab({ r: 1, g: 1, b: 1, alpha: 1 })
    expect(white.l).toBeCloseTo(1, 6)
    expect(white.a).toBeCloseTo(0, 6)
    expect(white.b).toBeCloseTo(0, 6)

    const red = rgbToOklab({ r: 1, g: 0, b: 0, alpha: 1 })
    expect(red.l).toBeCloseTo(0.62796, 4)
    expect(red.a).toBeCloseTo(0.22486, 4)
    expect(red.b).toBeCloseTo(0.12585, 4)

    expect(rgbToOklab({ r: 0, g: 0, b: 0, alpha: 0.5 })).toEqual({ l: 0, a: 0, b: 0, alpha: 0.5 })
  })

  it('treats Display P3 white as the same white', () => {
    const white = rgbToOklab({ r: 1, g: 1, b: 1, alpha: 1 }, 'display-p3')
    expect(white.l).toBeCloseTo(1, 6)
    expect(Math.hypot(white.a, white.b)).toBeLessThan(1e-6)
  })

  it('round-trips RGB through OKLab in both spaces', () => {
    fc.assert(
      fc.property(rgb, space, (color, s) => {
        const back = oklabToRgb(rgbToOklab(color, s), s)
        return Math.max(Math.abs(back.r - color.r), Math.abs(back.g - color.g), Math.abs(back.b - color.b)) < 1e-9
          && back.alpha === color.alpha
      }),
    )
  })
})

describe('OKLCH', () => {
  it('round-trips through OKLab', () => {
    fc.assert(
      fc.property(oklch, (color) => {
        const back = oklabToOklch(oklchToOklab(color))
        const hueError = Math.abs(((back.h - color.h + 540) % 360) - 180)
        return Math.abs(back.l - color.l) < 1e-12 && Math.abs(back.c - color.c) < 1e-12 && (color.c < 1e-6 || hueError < 1e-6)
      }),
    )
  })

  it('reports hue 0 for greys', () => {
    expect(oklabToOklch({ l: 0.5, a: 0, b: 0, alpha: 1 }).h).toBe(0)
  })

  it('keeps hue in 0–360', () => {
    expect(oklabToOklch({ l: 0.5, a: 0.1, b: -0.1, alpha: 1 }).h).toBeCloseTo(315, 9)
  })
})

describe('deltaEOK', () => {
  it('is zero for identical colours and symmetric', () => {
    const x: Oklab = { l: 0.5, a: 0.1, b: 0.05, alpha: 1 }
    const y: Oklab = { l: 0.6, a: 0.1, b: 0.05, alpha: 1 }
    expect(deltaEOK(x, x)).toBe(0)
    expect(deltaEOK(x, y)).toBeCloseTo(0.1, 12)
    expect(deltaEOK(y, x)).toBe(deltaEOK(x, y))
  })
})

describe('gamut', () => {
  const p3Red = rgbToOklab({ r: 1, g: 0, b: 0, alpha: 1 }, 'display-p3')

  it('knows P3 red is outside sRGB', () => {
    expect(inGamut(p3Red, 'display-p3')).toBe(true)
    expect(inGamut(p3Red)).toBe(false)
  })

  it('maps lightness extremes to white and black', () => {
    expect(gamutMap({ l: 1.2, a: 0.1, b: 0, alpha: 0.5 })).toEqual({ r: 1, g: 1, b: 1, alpha: 0.5 })
    expect(gamutMap({ l: -0.1, a: 0.1, b: 0, alpha: 1 })).toEqual({ r: 0, g: 0, b: 0, alpha: 1 })
  })

  it('leaves in-gamut colours alone', () => {
    const color = rgbToOklab({ r: 0.2, g: 0.4, b: 0.6, alpha: 1 })
    const mapped = gamutMap(color)
    expect(mapped.r).toBeCloseTo(0.2, 9)
    expect(mapped.g).toBeCloseTo(0.4, 9)
    expect(mapped.b).toBeCloseTo(0.6, 9)
  })

  it('clips colours that are only just outside', () => {
    const color = rgbToOklab({ r: 1.002, g: 0.5, b: 0.5, alpha: 1 })
    expect(gamutMap(color).r).toBe(1)
  })

  it('reduces chroma and keeps hue for vivid colours', () => {
    const vivid = oklchToOklab({ l: 0.7, c: 0.4, h: 145, alpha: 1 })
    const mapped = rgbToOklab(gamutMap(vivid))
    const lch = oklabToOklch(mapped)
    expect(lch.l).toBeCloseTo(0.7, 1)
    expect(Math.abs(lch.h - 145)).toBeLessThan(5)
    expect(lch.c).toBeLessThan(0.4)
  })

  it('converges on near-black colours where no chroma step is within a JND', () => {
    const out = gamutMap(oklchToOklab({ l: 0.001, c: 0.1, h: 56, alpha: 1 }))
    expect([out.r, out.g, out.b].every((c) => c >= 0 && c <= 1)).toBe(true)
    expect(rgbToOklab(out).l).toBeLessThan(0.02)
  })

  it('always lands in gamut, close to the original', () => {
    fc.assert(
      fc.property(oklch, space, (lch, s) => {
        const color = oklchToOklab(lch)
        const out = gamutMap(color, s)
        const inRange = [out.r, out.g, out.b].every((c) => c >= 0 && c <= 1)
        const mapped = oklabToOklch(rgbToOklab(out, s))
        return inRange && Math.abs(mapped.l - lch.l) < 0.05 && mapped.c <= lch.c + 0.02
      }),
      { numRuns: 500 },
    )
  })
})
