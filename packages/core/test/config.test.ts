import { describe, expect, it } from 'vitest'
import { renderRatio } from '@/config'

const defaults = { pixelRatio: 0.5, maxPixels: 1280 }

describe('renderRatio', () => {
  it('renders at half the device pixel ratio by default', () => {
    expect(renderRatio(2, 400, 300, defaults)).toBe(1)
    expect(renderRatio(3, 400, 300, defaults)).toBe(1.5)
    expect(renderRatio(1, 400, 300, defaults)).toBe(0.5)
  })

  it('reaches full device resolution with pixelRatio 1, and no further', () => {
    expect(renderRatio(2, 400, 300, { ...defaults, pixelRatio: 1 })).toBe(2)
    expect(renderRatio(2, 400, 300, { ...defaults, pixelRatio: 4 })).toBe(2)
  })

  it('keeps each axis within maxPixels', () => {
    expect(renderRatio(2, 1920, 600, { ...defaults, pixelRatio: 1 })).toBeCloseTo(1280 / 1920)
    expect(renderRatio(2, 300, 2560, { ...defaults, pixelRatio: 1 })).toBe(0.5)
  })

  it('treats a missing devicePixelRatio as 1', () => {
    expect(renderRatio(0, 400, 300, { ...defaults, pixelRatio: 1 })).toBe(1)
  })
})
