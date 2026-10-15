import type { AuroraInput, InteractionBindingInput } from '@/index'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { assertAurora, parseAurora, SCHEMA_URL, stringifyAurora } from '@/index'

const base: AuroraInput = { format: 'aurora', version: 1, name: 'Interactive', palette: ['#fff'], layers: [{ type: 'aurora-fbm' }] }
const binding: InteractionBindingInput = { layer: 0, parameter: 'offsetX', input: 'x' }

describe('interaction documents', () => {
  it('leaves unconfigured documents unchanged and fills interaction defaults only when configured', () => {
    expect(assertAurora(base)).not.toHaveProperty('interactions')
    expect(assertAurora({ ...base, interactions: [{ type: 'follow', bindings: [binding] }] }).interactions).toEqual([{
      type: 'follow', activation: 'both', strength: 1, smoothing: 0.65, decay: 1, damping: 0.75,
      bindings: [{ ...binding, amount: 1, slot: 0 }],
    }])
  })

  it('round-trips data-only modules without transient gesture or playback state', () => {
    fc.assert(fc.property(fc.constantFrom('follow', 'impulse', 'grab'), fc.double({ min: -4, max: 4, noNaN: true }), (type, amount) => {
      const authored = { ...base, interactions: [{ type, bindings: [{ ...binding, amount }] }] }
      // JSON normalizes negative zero, so compare against the authored JSON representation.
      expect(assertAurora(stringifyAurora(authored))).toEqual(assertAurora(JSON.stringify({ $schema: SCHEMA_URL, ...authored })))
    }))
  })

  it.each([
    [{ type: 'follow', bindings: [binding], pointer: { x: 1 } }, '$.interactions[0].pointer', 'is not a known key. Expected one of: type, activation, strength, smoothing, decay, damping, bindings.'],
    [{ type: 'grab', bindings: [{ ...binding, layer: 16 }] }, '$.interactions[0].bindings[0].layer', 'must be 15 or less.'],
    [{ type: 'impulse', bindings: [{ ...binding, slot: 4 }] }, '$.interactions[0].bindings[0].slot', 'must be between 0 and 3.'],
    [{ type: 'follow', bindings: [] }, '$.interactions[0].bindings', 'must have at least one binding.'],
    [{ type: 'follow', decay: 0, bindings: [binding] }, '$.interactions[0].decay', 'must be between 0.05 and 5.'],
  ])('rejects invalid configuration with an exact diagnostic', (interaction, path, message) => {
    const parsed = parseAurora({ ...base, interactions: [interaction] })
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.issues).toEqual([{ path, message }])
  })
})
