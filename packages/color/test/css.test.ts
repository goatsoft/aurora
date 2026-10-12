import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { deltaEOK, formatOklch, oklabToOklch, parseColor, rgbToOklab } from '@/index'
import type { Oklab } from '@/index'

function parsed(input: string): Oklab {
  const result = parseColor(input)
  if (!result.ok) throw new Error(result.message)
  return result.color
}

const error = (input: string) => {
  const result = parseColor(input)
  return result.ok ? undefined : result.message
}

describe('parseColor', () => {
  it('parses hex in every length', () => {
    const red = rgbToOklab({ r: 1, g: 0, b: 0, alpha: 1 })
    for (const hex of ['#f00', '#F00F', '#ff0000', '#ff0000ff']) expect(parsed(hex)).toEqual(red)
    expect(parsed('#ff000080').alpha).toBeCloseTo(128 / 255, 9)
  })

  it('parses oklch with numbers, percentages, degrees and alpha', () => {
    expect(oklabToOklch(parsed('oklch(0.7 0.15 245)'))).toMatchObject({ l: 0.7, alpha: 1 })
    const lch = oklabToOklch(parsed('  OKLCH(70% 50% 245deg / 50%)  '))
    expect(lch.l).toBeCloseTo(0.7, 12)
    expect(lch.c).toBeCloseTo(0.2, 12)
    expect(lch.h).toBeCloseTo(245, 9)
    expect(lch.alpha).toBe(0.5)
  })

  it('parses oklab and clamps lightness and alpha', () => {
    expect(parsed('oklab(1.5 0.1 -0.1 / 2)')).toEqual({ l: 1, a: 0.1, b: -0.1, alpha: 1 })
    expect(parsed('oklab(50% 25% -25%)')).toEqual({ l: 0.5, a: 0.1, b: -0.1, alpha: 1 })
  })

  it('clamps negative chroma to zero', () => {
    expect(oklabToOklch(parsed('oklch(0.5 -0.1 30)')).c).toBe(0)
  })

  it('parses color() in sRGB and Display P3', () => {
    expect(parsed('color(srgb 1 0 0)')).toEqual(rgbToOklab({ r: 1, g: 0, b: 0, alpha: 1 }))
    expect(parsed('color(display-p3 100% 0% 0% / 0.25)')).toEqual(rgbToOklab({ r: 1, g: 0, b: 0, alpha: 0.25 }, 'display-p3'))
  })

  it('explains what is wrong', () => {
    expect(error('red')).toMatch(/"red" is not a colour\. Use oklch/)
    expect(error('#ff00')).toBeUndefined()
    expect(error('#ff000')).toMatch(/not a valid hex colour/)
    expect(error('rgb(1 2 3)')).toMatch(/rgb\(\) is not supported/)
    expect(error('color(rec2020 1 0 0)')).toMatch(/color\(\) supports srgb and display-p3, not "rec2020"/)
    expect(error('color()')).toMatch(/not ""/)
    expect(error('oklch(0.5 0.1)')).toMatch(/oklch\(\) expects 3 space-separated values/)
    expect(error('oklch(0.5 0.1 30 / 1 2)')).toMatch(/expects 3/)
    expect(error('oklch(0.5 0.1 30 /)')).toMatch(/expects 3/)
    expect(error('color(srgb 1 0)')).toMatch(/color\(srgb\) expects 3/)
    expect(error('oklch(0.5 0.1 abc)')).toBe('oklch(): "abc" is not a valid value.')
    expect(error('oklch(0.5deg 0.1 30)')).toMatch(/"0.5deg" is not a valid value/)
    expect(error('oklch(0.5 0.1 30%)')).toMatch(/"30%" is not a valid value/)
    expect(error('oklch(0.5 0.1 30 / x)')).toBe('oklch(): alpha "x" is not a valid value.')
  })
})

describe('formatOklch', () => {
  it('writes canonical oklch()', () => {
    expect(formatOklch(parsed('oklch(0.68 0.16 245)'))).toBe('oklch(0.68 0.16 245)')
    expect(formatOklch(parsed('oklch(0.68 0.16 245 / 0.5)'))).toBe('oklch(0.68 0.16 245 / 0.5)')
  })

  it('round-trips through parseColor within rounding', () => {
    const color = fc.record({
      l: fc.double({ min: 0, max: 1, noNaN: true }),
      a: fc.double({ min: -0.4, max: 0.4, noNaN: true }),
      b: fc.double({ min: -0.4, max: 0.4, noNaN: true }),
      alpha: fc.double({ min: 0, max: 1, noNaN: true }),
    })
    fc.assert(
      fc.property(color, (c) => {
        const back = parsed(formatOklch(c))
        return deltaEOK(back, c) < 1e-3 && Math.abs(back.alpha - c.alpha) < 1e-4
      }),
    )
  })
})
