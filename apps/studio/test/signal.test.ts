import { assertAurora } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { ops, serialize, starter } from '@/editor/document'
import { History } from '@/editor/history'
import { decodeShare, encodeShare } from '@/editor/share'

describe('signal effect authoring', () => {
  it('preserves authored controls through save, share, undo and redo', async () => {
    const original = starter()
    const history = new History(original)
    const enabled = ops.modifier(original, 'signal', {})
    history.push(enabled)
    const edited = ops.modifier(enabled, 'signal', { amount: 0.7, frequency: 0, tracking: 0.5 })
    history.push(edited)
    expect(original).not.toHaveProperty('modifiers')
    expect(assertAurora(serialize(edited)).modifiers?.signal).toMatchObject({ amount: 0.7, frequency: 0, tracking: 0.5 })
    expect(await decodeShare(await encodeShare(edited))).toEqual(edited)
    expect(history.undo()).toEqual(enabled)
    expect(history.redo()).toEqual(edited)
    const removed = ops.modifier(edited, 'signal', undefined)
    expect(removed).toEqual(original)
    expect(serialize(removed)).toBe(serialize(original))
  })
})

describe('independent scene modifiers', () => {
  it('edits and removes one modifier while preserving the others', () => {
    const signal = ops.modifier(starter(), 'signal', { shake: 0.8 })
    const pixelated = ops.modifier(signal, 'pixelate', { size: 12 })
    const shaded = ops.modifier(pixelated, 'vignette', { amount: 0.3 })
    const removed = ops.modifier(shaded, 'pixelate', undefined)
    expect(removed.modifiers).toEqual({ signal: { shake: 0.8 }, vignette: { amount: 0.3 } })
    expect(assertAurora(serialize(removed)).modifiers).toMatchObject(removed.modifiers!)
  })
})
