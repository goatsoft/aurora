import type { AuroraDocument, AuroraInput, FormatIssue } from '@goatsoft/aurora-format'
import { checkDocument } from '@goatsoft/aurora'
import { FORMAT_ID, FORMAT_VERSION, parseAurora, stringifyAurora } from '@goatsoft/aurora-format'

/**
 * Studio edits the document as authored, not with defaults filled in, so opening a file and saving
 * it changes nothing, and a value you set is written even when it equals the default (presets
 * spell some out on purpose). Resetting a value removes it. New layers are written in the house
 * style the presets use: `type`, `blend`, `params`, `colors` and `mix`, always.
 *
 * Every operation is pure: it returns a new document and leaves its input alone.
 */
export type Doc = AuroraInput
export type LayerInput = Doc['layers'][number]
export type CanvasInput = NonNullable<Doc['canvas']>
export type MotionInput = NonNullable<Doc['motion']>
type ParamValue = number | boolean | string

/** What Studio opens with: the flagship aurora, faded top and bottom. */
export function starter(): Doc {
  return {
    format: FORMAT_ID,
    version: FORMAT_VERSION,
    name: 'Untitled aurora',
    canvas: { fade: 'y' },
    palette: ['oklch(0.68 0.16 245)', 'oklch(0.56 0.22 285)', 'oklch(0.58 0.25 310)'],
    layers: [newLayer('aurora-fbm', [0, 1, 2])],
  }
}

export function newLayer(type: string, colors: number[]): LayerInput {
  return { type, blend: 'normal', params: {}, colors, mix: 'oklab' }
}

/**
 * Validates for rendering and saving, as strictly as the build plugin: the format, then every
 * generator id, parameter name and range (against the loaded generators; Studio loads them all at
 * start). Studio keeps showing the last valid document while this fails.
 */
export function resolve(doc: Doc): { ok: true, doc: AuroraDocument } | { ok: false, issues: FormatIssue[] } {
  const parsed = parseAurora(doc)
  if (!parsed.ok) return parsed
  const issues = checkDocument(parsed.doc)
  return issues.length ? { ok: false, issues } : parsed
}

/** The `.aurora` file for a document. */
export function serialize(doc: Doc): string {
  return stringifyAurora(doc)
}

export { snap } from '@goatsoft/aurora-editor-ui'

function edit(doc: Doc, change: (draft: Doc) => void): Doc {
  const draft = structuredClone(doc)
  change(draft)
  return draft
}

const layerAt = (doc: Doc, i: number) => {
  const layer = doc.layers[i]
  if (!layer) throw new RangeError(`There is no layer ${i}; the document has ${doc.layers.length}.`)
  return layer
}

/**
 * The palette indices a layer reads, one per generator colour. A layer without `colors` cycles
 * through the whole palette, so what it reads depends on the palette's length.
 */
export function layerColors(layer: LayerInput, paletteLength: number, count: number): number[] {
  const source = layer.colors?.length ? layer.colors : Array.from({ length: paletteLength }, (_, k) => k)
  return Array.from({ length: count }, (_, k) => source[k % source.length]!)
}

export const ops = {
  /** Toggle or replace one scene modifier without changing the others. */
  modifier: <K extends keyof NonNullable<Doc['modifiers']>>(doc: Doc, key: K, value: NonNullable<Doc['modifiers']>[K]) => edit(doc, (d) => {
    const modifiers = { ...d.modifiers }
    if (value === undefined) Reflect.deleteProperty(modifiers, key)
    else modifiers[key] = value
    if (Object.keys(modifiers).length) d.modifiers = modifiers
    else delete d.modifiers
  }),

  rename: (doc: Doc, name: string) => edit(doc, (d) => {
    d.name = name
  }),

  /** Sets (or, with `undefined`, resets) a canvas setting. An empty `canvas` is removed. */
  canvas: <K extends keyof CanvasInput>(doc: Doc, key: K, value: CanvasInput[K] | undefined) => edit(doc, (d) => {
    const canvas: CanvasInput = { ...d.canvas }
    if (value === undefined) Reflect.deleteProperty(canvas, key)
    else canvas[key] = value
    if (Object.keys(canvas).length) d.canvas = canvas
    else delete d.canvas
  }),

  motion: <K extends keyof MotionInput>(doc: Doc, key: K, value: MotionInput[K] | undefined) => edit(doc, (d) => {
    const motion: MotionInput = { ...d.motion }
    if (value === undefined) Reflect.deleteProperty(motion, key)
    else motion[key] = value
    if (Object.keys(motion).length) d.motion = motion
    else delete d.motion
  }),

  color: (doc: Doc, index: number, css: string) => edit(doc, (d) => {
    d.palette[index] = css
  }),

  addColor: (doc: Doc, css: string) => edit(doc, (d) => {
    d.palette.push(css)
  }),

  /** Removes a palette colour; layers that used it move to its neighbour, and later indices shift down. */
  removeColor: (doc: Doc, index: number) => edit(doc, (d) => {
    if (d.palette.length <= 1) return
    d.palette.splice(index, 1)
    const fallback = Math.min(index, d.palette.length - 1)
    for (const layer of d.layers) {
      if (layer.colors) layer.colors = layer.colors.map((c) => (c === index ? fallback : c > index ? c - 1 : c))
    }
  }),

  /**
   * Gives one colour slot of a layer its own copy of the palette colour it reads, so editing it
   * changes only that slot. Layers that cycle through the whole palette would start reading the new
   * colour too, so every layer's current colours are written out first. `count` gives a generator's
   * number of colours.
   */
  ownColor: (doc: Doc, i: number, slot: number, count: (type: string) => number) => edit(doc, (d) => {
    const length = d.palette.length
    for (const layer of d.layers) {
      if (!layer.colors?.length) layer.colors = layerColors(layer, length, count(layer.type))
    }
    const layer = layerAt(d, i)
    const colors = layerColors(layer, length, count(layer.type))
    d.palette.push(d.palette[colors[slot]!]!)
    colors[slot] = length
    layer.colors = colors
  }),

  addLayer: (doc: Doc, layer: LayerInput, at = doc.layers.length) => edit(doc, (d) => {
    d.layers.splice(at, 0, layer)
  }),

  removeLayer: (doc: Doc, i: number) => edit(doc, (d) => {
    if (d.layers.length > 1) d.layers.splice(i, 1)
  }),

  duplicateLayer: (doc: Doc, i: number) => edit(doc, (d) => {
    d.layers.splice(i + 1, 0, structuredClone(layerAt(d, i)))
  }),

  moveLayer: (doc: Doc, from: number, to: number) => edit(doc, (d) => {
    const [layer] = d.layers.splice(from, 1)
    d.layers.splice(Math.max(0, Math.min(to, d.layers.length)), 0, layer!)
  }),

  /** Sets a layer field; `undefined` removes it (back to its default). */
  layer: <K extends keyof LayerInput>(doc: Doc, i: number, key: K, value: LayerInput[K] | undefined) => edit(doc, (d) => {
    const layer = layerAt(d, i)
    if (value === undefined) Reflect.deleteProperty(layer, key)
    else layer[key] = value
  }),

  /** Sets a generator param; `undefined` resets it. Keys stay in the order they were first set. */
  param: (doc: Doc, i: number, name: string, value: ParamValue | undefined) => edit(doc, (d) => {
    const layer = layerAt(d, i)
    const params = { ...layer.params }
    if (value === undefined) Reflect.deleteProperty(params, name)
    else params[name] = value
    layer.params = params
  }),

  /** Changes a layer's generator, keeping its blend, colours and mix but dropping params it can't use. */
  retype: (doc: Doc, i: number, type: string, params: readonly string[]) => edit(doc, (d) => {
    const layer = layerAt(d, i)
    layer.type = type
    layer.params = Object.fromEntries(Object.entries(layer.params ?? {}).filter(([name]) => params.includes(name)))
  }),
}
