import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { compositeOver, contrastOn, contrastRatio, gamutMap, inGamut, luminance, maxChroma, oklchToOklab, rgbToOklab } from '@/index'

const white = rgbToOklab({ r: 1, g: 1, b: 1, alpha: 1 })
const black = rgbToOklab({ r: 0, g: 0, b: 0, alpha: 1 })

describe('contrast', () => {
  it('matches WCAG reference values', () => {
    expect(luminance(white)).toBeCloseTo(1, 6)
    expect(luminance(black)).toBe(0)
    expect(contrastRatio(black, white)).toBeCloseTo(21, 4)
    // #767676 on white is the classic 4.54:1 AA grey.
    const grey = rgbToOklab({ r: 0x76 / 255, g: 0x76 / 255, b: 0x76 / 255, alpha: 1 })
    expect(contrastRatio(white, grey)).toBeCloseTo(4.54, 2)
  })

  it('is symmetric and at least 1', () => {
    const unit = fc.double({ min: 0, max: 1, noNaN: true })
    fc.assert(fc.property(unit, unit, unit, unit, (r, g, b, k) => {
      const x = rgbToOklab({ r, g, b, alpha: 1 })
      const y = rgbToOklab({ r: k, g: k, b: k, alpha: 1 })
      return contrastRatio(x, y) === contrastRatio(y, x) && contrastRatio(x, y) >= 1
    }))
  })
})

describe('composited contrast', () => {
  it('measures the visible colours on either a light or dark canvas', () => {
    expect(contrastOn(black, white, black)).toBeCloseTo(21, 4)
    expect(contrastOn(white, { ...black, alpha: 0 }, black)).toBeCloseTo(21, 4)
    expect(contrastOn(black, { ...black, alpha: 0 }, white)).toBeCloseTo(21, 4)
    expect(contrastOn({ ...white, alpha: 0.5 }, black, black)).toBeCloseTo(5.28, 2)
    expect(contrastOn(black, { ...black, alpha: 0.5 }, white)).toBeCloseTo(5.28, 2)
    expect(contrastOn({ ...white, alpha: 0 }, black, white)).toBeCloseTo(1, 6)
    expect(() => contrastOn(white, black, { ...white, alpha: 0.5 })).toThrow('contrastOn requires an opaque canvas colour.')
  })

  it('preserves source-over alpha and supports either RGB display space', () => {
    expect(compositeOver({ ...white, alpha: 0 }, { ...black, alpha: 0 })).toEqual({ l: 0, a: 0, b: 0, alpha: 0 })
    const red = rgbToOklab({ r: 1, g: 0, b: 0, alpha: 0.5 })
    const blue = rgbToOklab({ r: 0, g: 0, b: 1, alpha: 0.5 })
    const mixed = gamutMap(compositeOver(red, blue))
    expect(mixed.alpha).toBe(0.75)
    expect(mixed.r).toBeCloseTo(2 / 3, 5)
    expect(mixed.b).toBeCloseTo(1 / 3, 5)
    const p3 = rgbToOklab({ r: 1, g: 0.3, b: 0.1, alpha: 1 }, 'display-p3')
    const composited = compositeOver(p3, black, 'display-p3')
    for (const channel of ['l', 'a', 'b', 'alpha'] as const) expect(composited[channel]).toBeCloseTo(p3[channel], 6)
  })

  it('keeps visible contrast bounded and transparent foregrounds at 1:1', () => {
    const unit = fc.double({ min: 0, max: 1, noNaN: true })
    fc.assert(fc.property(unit, unit, unit, unit, (r, g, b, alpha) => {
      const color = rgbToOklab({ r, g, b, alpha })
      const ratio = contrastOn(color, { ...white, alpha }, black)
      expect(ratio).toBeGreaterThanOrEqual(1)
      expect(ratio).toBeLessThanOrEqual(21.00001)
      expect(contrastOn({ ...color, alpha: 0 }, white, black)).toBeCloseTo(1, 6)
    }))
  })
})

describe('maxChroma', () => {
  it('finds the gamut boundary', () => {
    fc.assert(fc.property(fc.double({ min: 0.05, max: 0.95, noNaN: true }), fc.double({ min: 0, max: 359, noNaN: true }), (l, h) => {
      const c = maxChroma(l, h)
      return inGamut(oklchToOklab({ l, c, h, alpha: 1 })) && !inGamut(oklchToOklab({ l, c: c + 0.002, h, alpha: 1 }))
    }), { numRuns: 200 })
  })

  it('is wider in Display P3 and zero at black and white', () => {
    expect(maxChroma(0.6, 30, 'display-p3')).toBeGreaterThan(maxChroma(0.6, 30))
    expect(maxChroma(0, 30)).toBe(0)
    expect(maxChroma(1, 30)).toBe(0)
  })
})
