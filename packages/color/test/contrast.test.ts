import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { contrastRatio, inGamut, luminance, maxChroma, oklchToOklab, rgbToOklab } from '@/index'

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
