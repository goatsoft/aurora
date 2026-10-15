import type { Doc } from '@/editor/document'
import { loadGenerators } from '@goatsoft/aurora'
import { describe, expect, it } from 'vitest'
import { newLayer, ops, resolve, serialize, starter } from '@/editor/document'
import { useStudio } from '@/editor/studio'

await loadGenerators()
const doc: Doc = { ...starter(), modifiers: { signal: { amount: 0 } }, layers: [newLayer('aurora-fbm', [0, 1, 2]), newLayer('mountains', [0, 1, 2]), newLayer('treeline', [0, 1, 2])], interactions: [{ type: 'follow', bindings: [
  { layer: 0, parameter: 'offsetX', input: 'x' }, { layer: 1, parameter: 'offsetX', input: 'x' },
  { layer: 2, parameter: 'offsetY', input: 'y' }, { parameter: 'signal.amount', input: 'strength' },
] }] }
const indices = (value: Doc) => value.interactions![0]!.bindings.map((binding) => binding.layer)

describe('interaction editor operations', () => {
  it('keeps response targets attached to the same layers when inserting, moving and removing', () => {
    expect(indices(ops.addLayer(doc, newLayer('grain', [0]), 1))).toEqual([0, 2, 3, undefined])
    expect(indices(ops.moveLayer(doc, 0, 2))).toEqual([2, 0, 1, undefined])
    expect(indices(ops.moveLayer(doc, 2, 0))).toEqual([1, 2, 0, undefined])
    const removed = ops.removeLayer(doc, 1)
    expect(indices(removed)).toEqual([0, 1, undefined])
    expect(resolve(removed).ok).toBe(true)
    expect(indices(doc)).toEqual([0, 1, 2, undefined])
  })

  it('duplicates responses along with a layer and removes modules that lose their final target', () => {
    const copy = ops.duplicateLayer(doc, 1)
    expect(indices(copy)).toEqual([0, 1, 3, undefined, 2])
    expect(resolve(copy).ok).toBe(true)
    const one = { ...doc, interactions: [{ type: 'follow' as const, bindings: [{ layer: 1, parameter: 'offsetX', input: 'x' as const }] }] }
    expect(ops.removeLayer(one, 1).interactions).toBeUndefined()
  })

  it('drops incompatible controls when retyping while retaining generic layer responses', () => {
    const bound = ops.interaction(doc, 0, { type: 'follow', bindings: [{ layer: 0, parameter: 'intensity', input: 'strength' }, { layer: 0, parameter: 'offsetX', input: 'x' }] })
    const changed = ops.retype(bound, 0, 'water', ['speed', 'scale'])
    expect(changed.interactions![0]!.bindings).toEqual([{ layer: 0, parameter: 'offsetX', input: 'x' }])
    expect(resolve(changed).ok).toBe(true)
  })

  it('saves configuration through history without saving drag or playback state', () => {
    const studio = useStudio()
    studio.open(starter())
    const before = studio.doc.value
    const next = ops.interaction(before, 0, { type: 'follow', bindings: [{ layer: 0, parameter: 'offsetX', input: 'x', amount: 0.12 }] })
    studio.commit(next)
    const text = studio.file.value
    studio.ui.playing = false
    studio.ui.dragInteractions = true
    expect(studio.file.value).toBe(text)
    expect(JSON.parse(text)).toHaveProperty('interactions', next.interactions)
    expect(serialize(JSON.parse(text) as Doc)).toBe(text)
    studio.undo()
    expect(studio.doc.value).toBe(before)
    studio.redo()
    expect(studio.doc.value.interactions).toEqual(next.interactions)
  })

  it('adds an impulse and Ping layer in one history step while preserving surviving layer ids', () => {
    const studio = useStudio()
    studio.open(starter())
    const [id] = studio.layerIds.value
    studio.layers.add({ type: 'ping', opacity: 0, params: { background: 0 } }, 1, studio.doc.value, { type: 'impulse', bindings: [{ layer: 1, parameter: 'opacity', input: 'strength' }] })
    expect(studio.layerIds.value[0]).toBe(id)
    expect(studio.issues.value).toEqual([])
    expect(studio.doc.value.interactions![0]!.bindings[0]!.layer).toBe(1)
    studio.undo()
    expect(studio.doc.value.layers).toHaveLength(1)
    expect(studio.doc.value.interactions).toBeUndefined()
    expect(studio.layerIds.value).toEqual([id])
  })
})
