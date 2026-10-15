import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { assertAurora, parseAurora, SIGNAL_DEFAULTS, stringifyAurora } from '@/index'

const base = { format: 'aurora', version: 1, name: 'Signal', palette: ['#fff'], layers: [{ type: 'aurora-fbm' }] }

describe('signal distortion', () => {
  it('is opt-in and fills defaults only for an authored signal effect', () => {
    expect(assertAurora(base)).not.toHaveProperty('modifiers')
    expect(assertAurora({ ...base, modifiers: {} }).modifiers).toEqual({})
    expect(assertAurora({ ...base, modifiers: { signal: {} } }).modifiers?.signal).toEqual(SIGNAL_DEFAULTS)
  })

  it.each([
    ['amount', -0.01, 'must be between 0 and 1.'],
    ['shake', 1.1, 'must be between 0 and 1.'],
    ['tearSize', 0, 'must be between 0.02 and 0.5.'],
    ['separation', 2, 'must be between 0 and 1.'],
    ['tracking', -1, 'must be between 0 and 1.'],
    ['frequency', 3, 'must be between 0 and 2.'],
    ['seed', 0.5, 'must be a whole number.'],
    ['amount', 'high', 'must be a number, got "high".'],
  ])('validates %s with a precise path and message', (key, value, message) => {
    const result = parseAurora({ ...base, modifiers: { signal: { [key]: value } } })
    expect(result).toMatchObject({ ok: false, issues: [{ path: `$.modifiers.signal.${key}`, message }] })
  })

  it('round-trips every supported signal control without losing authored settings', () => {
    const unit = fc.double({ min: 0, max: 1, noNaN: true })
    fc.assert(fc.property(fc.record({ amount: unit, shake: unit, tearSize: fc.double({ min: 0.02, max: 0.5, noNaN: true }), separation: unit, tracking: unit, frequency: fc.double({ min: 0, max: 2, noNaN: true }), seed: fc.integer({ min: 0, max: 100 }) }), (signal) => {
      const doc = assertAurora({ ...base, modifiers: { signal } })
      expect(assertAurora(stringifyAurora(doc)).modifiers?.signal).toEqual(signal)
    }))
  })
})

describe('pixelate and vignette modifiers', () => {
  it('validates and preserves a combined modifier stack', () => {
    const doc = assertAurora({ ...base, modifiers: { signal: {}, pixelate: {}, vignette: {} } })
    expect(doc.modifiers?.pixelate).toEqual({ size: 8 })
    expect(doc.modifiers?.vignette).toEqual({ amount: 0.45, radius: 0.45, softness: 0.45 })
    expect(assertAurora(stringifyAurora(doc)).modifiers).toEqual(doc.modifiers)
  })
  it.each([
    ['pixelate', { size: 0 }, '$.modifiers.pixelate.size', 'must be between 1 and 64.'],
    ['pixelate', { size: 1.5 }, '$.modifiers.pixelate.size', 'must be a whole number.'],
    ['vignette', { amount: 2 }, '$.modifiers.vignette.amount', 'must be between 0 and 1.'],
    ['vignette', { radius: -1 }, '$.modifiers.vignette.radius', 'must be between 0 and 1.'],
    ['vignette', { softness: 0 }, '$.modifiers.vignette.softness', 'must be between 0.01 and 1.'],
  ])('rejects invalid %s controls', (name, params, path, message) => {
    expect(parseAurora({ ...base, modifiers: { [name]: params } })).toMatchObject({ ok: false, issues: [{ path, message }] })
  })
})
