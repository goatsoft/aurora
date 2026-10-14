import type { CanvasInput, Doc, LayerInput, MotionInput } from '@/editor/document'
import { readdirSync, readFileSync } from 'node:fs'
import { loadGenerators } from '@goatsoft/aurora'
import { describe, expect, inject, it } from 'vitest'
import { newLayer, ops, resolve, serialize, snap, starter } from '@/editor/document'

const root = inject('root')
await loadGenerators()
const read = (pack: string) => readdirSync(`${root}/presets/${pack}`).filter((f) => f.endsWith('.aurora')).map((f) => [f, readFileSync(`${root}/presets/${pack}/${f}`, 'utf8')] as const)

/**
 * Rebuilds a preset the way a designer would in Studio: starting from Studio's own starter, using
 * only the editor's operations (what the panels call), in the order the file lists things.
 */
function recreate(target: Doc): Doc {
  let doc = ops.rename(starter(), target.name)
  for (const key of Object.keys(doc.canvas ?? {}) as (keyof CanvasInput)[]) doc = ops.canvas(doc, key, undefined)
  for (const [key, value] of Object.entries(target.canvas ?? {})) doc = ops.canvas(doc, key as keyof CanvasInput, value)
  for (const [key, value] of Object.entries(target.motion ?? {})) doc = ops.motion(doc, key as keyof MotionInput, value)
  target.palette.forEach((css, i) => {
    doc = i < doc.palette.length ? ops.color(doc, i, css) : ops.addColor(doc, css)
  })
  while (doc.palette.length > target.palette.length) doc = ops.removeColor(doc, doc.palette.length - 1)
  const starterLayers = doc.layers.length
  for (const layer of target.layers) {
    const i = doc.layers.length
    doc = ops.addLayer(doc, newLayer(layer.type, [...(layer.colors ?? [])]))
    if (layer.blend) doc = ops.layer(doc, i, 'blend', layer.blend)
    if (layer.opacity !== undefined) doc = ops.layer(doc, i, 'opacity', layer.opacity)
    for (const [name, value] of Object.entries(layer.params ?? {})) doc = ops.param(doc, i, name, value)
    if (layer.mix) doc = ops.layer(doc, i, 'mix', layer.mix)
    if (layer.mask) doc = ops.layer(doc, i, 'mask', layer.mask)
  }
  for (let k = 0; k < starterLayers; k++) doc = ops.removeLayer(doc, 0)
  return doc
}

describe('Studio recreates every classic and mono preset from scratch', () => {
  it.each([...read('classic'), ...read('mono')])('%s', (_, text) => {
    const doc = recreate(JSON.parse(text) as Doc)
    expect(resolve(doc).ok).toBe(true)
    expect(serialize(doc)).toBe(text)
  })
})

describe('serialize', () => {
  it.each([...read('classic'), ...read('mono'), ...read('scenes'), ...read('starters')])('round-trips %s unchanged', (_, text) => {
    expect(serialize(JSON.parse(text) as Doc)).toBe(text)
  })
})

describe('Tech scenes in Studio', () => {
  const names = ['ghost-terminal.aurora', 'signal-lost.aurora', 'night-protocol.aurora', 'deep-scan.aurora', 'echo-chamber.aurora']
  it.each(read('scenes').filter(([name]) => names.includes(name)))('recreates and edits %s using the inspector operations', (_, text) => {
    const doc = recreate(JSON.parse(text) as Doc)
    expect(resolve(doc).ok).toBe(true)
    const index = doc.layers.length - 1
    const duplicated = ops.duplicateLayer(doc, index)
    const edited = ops.layer(duplicated, index + 1, 'opacity', 0.4)
    const reopened = JSON.parse(serialize(edited)) as Doc
    expect(resolve(reopened).ok).toBe(true)
    expect(reopened.layers[index + 1]).toEqual({ ...doc.layers[index], opacity: 0.4 })
    expect(reopened.layers[index]).toEqual(doc.layers[index])
  })
})

describe('ops', () => {
  const base = starter()

  it('never mutates the document it is given', () => {
    const before = JSON.stringify(base)
    ops.param(base, 0, 'speed', 0.2)
    ops.removeColor(base, 0)
    ops.canvas(base, 'fade', undefined)
    expect(JSON.stringify(base)).toBe(before)
  })

  it('resets values by removing them, and drops emptied objects', () => {
    const set = ops.param(base, 0, 'speed', 0.2)
    expect(set.layers[0]!.params).toEqual({ speed: 0.2 })
    expect(ops.param(set, 0, 'speed', undefined).layers[0]!.params).toEqual({})
    expect(ops.canvas(base, 'fade', undefined).canvas).toBeUndefined()
    expect(ops.motion(ops.motion(base, 'speed', 2), 'speed', undefined).motion).toBeUndefined()
  })

  it('remaps layer colours when a palette colour is removed', () => {
    const doc = ops.removeColor(base, 1)
    expect(doc.palette).toHaveLength(2)
    expect(doc.layers[0]!.colors).toEqual([0, 1, 1])
    expect(ops.removeColor(ops.removeColor(doc, 0), 0).palette).toHaveLength(1)
  })

  it('moves, duplicates and removes layers, keeping at least one', () => {
    let doc = ops.addLayer(base, newLayer('grain', [0]))
    doc = ops.duplicateLayer(doc, 1)
    expect(doc.layers.map((l) => l.type)).toEqual(['aurora-fbm', 'grain', 'grain'])
    doc = ops.moveLayer(doc, 0, 2)
    expect(doc.layers.map((l) => l.type)).toEqual(['grain', 'grain', 'aurora-fbm'])
    expect(ops.removeLayer(base, 0).layers).toHaveLength(1)
    expect(() => ops.layer(base, 5, 'blend', 'add')).toThrow('There is no layer 5; the document has 1.')
  })

  it('keeps only the params a new generator understands when retyping', () => {
    const doc = ops.retype(ops.param(ops.param(base, 0, 'speed', 0.3), 0, 'stretch', 0.4), 0, 'water', ['speed', 'scale'])
    expect(doc.layers[0]).toMatchObject({ type: 'water', params: { speed: 0.3 } } satisfies Partial<LayerInput>)
  })
})

describe('snap', () => {
  it('rounds to the step without float noise', () => {
    expect(snap(0.1 + 0.2, 0.01)).toBe(0.3)
    expect(snap(0.38000000000000006, 0.01)).toBe(0.38)
    expect(snap(7.4, 1)).toBe(7)
    expect(snap(0.0349, 0.005)).toBe(0.035)
  })

  describe('ownColor', () => {
    const count = (type: string) => (type === 'aurora-fbm' ? 3 : 1)
    const two = (palette: string[], colors?: number[][]): Doc => ({
      ...starter(),
      palette,
      layers: [0, 1].map((i) => ({ type: 'aurora-fbm', ...(colors ? { colors: colors[i] } : {}) })),
    })

    it('leaves layers that cycle through the palette reading the same colours', () => {
      const doc = ops.ownColor(two(['red']), 0, 1, count)
      expect(doc.palette).toEqual(['red', 'red'])
      expect(doc.layers[0]!.colors).toEqual([0, 1, 0])
      expect(doc.layers[1]!.colors).toEqual([0, 0, 0])
      // Editing the copy now changes only the first layer's second slot.
      expect(ops.color(doc, 1, 'blue').layers[1]!.colors).toEqual([0, 0, 0])
    })

    it('redirects only the chosen slot of a layer with its own colours', () => {
      const doc = ops.ownColor(two(['red', 'green', 'blue'], [[0, 1, 2], [0, 1, 2]]), 1, 2, count)
      expect(doc.palette).toEqual(['red', 'green', 'blue', 'blue'])
      expect(doc.layers[0]!.colors).toEqual([0, 1, 2])
      expect(doc.layers[1]!.colors).toEqual([0, 1, 3])
    })
  })
})
