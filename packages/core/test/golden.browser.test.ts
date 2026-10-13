import { assertAurora, parseAurora } from '@goatsoft/aurora-format'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { compileCss } from '@/css'
import { GENERATORS, loadGenerators } from '@/generators/index'
import { compose } from '@/shader'
import { packUniforms } from '@/uniforms'
import { expectGolden } from './golden'
import { device, render } from './gpu'

await loadGenerators()

/** Every built-in generator, with its own defaults and palette: what a designer sees first. */
const W = 384
const H = 216
const TIME = 6.5

let gpu: GPUDevice
beforeAll(async () => {
  gpu = await device()
})
afterAll(() => {
  gpu.destroy()
})

describe('generator golden images', () => {
  it.each(Object.values(GENERATORS).filter((g) => !g.id.startsWith('test-')).map((g) => [g.id, g] as const))('%s', async (id, generator) => {
    const doc = assertAurora({ format: 'aurora', version: 1, name: id, palette: [...generator.palette], layers: [{ type: id }] })
    const shader = compose(doc)
    const pixels = await render(gpu, shader.code, packUniforms(doc, shader, { width: W, height: H, time: TIME, scroll: 0 }), W, H)
    // Composite onto the dark page the presets are designed for, so the PNG shows what a visitor sees.
    for (let i = 0; i < pixels.length; i += 4) {
      const a = pixels[i + 3]! / 255
      for (let k = 0; k < 3; k++) pixels[i + k] = Math.round(pixels[i + k]! + 8 * (1 - a))
      pixels[i + 3] = 255
    }
    await expectGolden(id, pixels, W, H)
  })
})

const scenes = import.meta.glob<string>('~/presets/scenes/*.aurora', { query: '?raw', import: 'default', eager: true })

describe('scene presets', () => {
  it.each(Object.entries(scenes).map(([file, text]) => [file.replace(/^.*\/|\.aurora$/g, ''), text] as const))('%s', async (name, text) => {
    const result = parseAurora(text)
    if (!result.ok) throw new Error(result.issues.map((issue) => issue.message).join('\n'))
    const shader = compose(result.doc)
    const pixels = await render(gpu, shader.code, packUniforms(result.doc, shader, { width: W, height: H, time: TIME, scroll: 0 }), W, H)
    for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255
    await expectGolden(`scene-${name}`, pixels, W, H)
  })
})

const MAX_LAYERS = 16

describe('all generators together', () => {
  // A document holds at most 16 layers, so with more generators than that, compose the first 16
  // and the last 16: every generator shares a shader with at least 15 others.
  const all = Object.values(GENERATORS).filter((g) => !g.id.startsWith('test-'))
  const batches = all.length <= MAX_LAYERS ? [all] : [all.slice(0, MAX_LAYERS), all.slice(-MAX_LAYERS)]
  it.each(batches.map((batch, i) => [i, batch] as const))('compose into one shader without name clashes, sharing the noise library (batch %i)', async (_, generators) => {
    const palette = generators.flatMap((g) => g.palette).slice(0, 16)
    const doc = assertAurora({ format: 'aurora', version: 1, name: 'all', palette, layers: generators.map((g) => ({ type: g.id, blend: 'screen', opacity: 0.4 })) })
    const shader = compose(doc)
    expect(shader.code.match(/fn noise_simplex\(/g)).toHaveLength(1)
    const pixels = await render(gpu, shader.code, packUniforms(doc, shader, { width: 64, height: 64, time: 1, scroll: 0 }), 64, 64)
    expect(pixels.some((v) => v > 0)).toBe(true)
  })

  it.each(Object.values(GENERATORS).filter((g) => !g.id.startsWith('test-')).map((g) => [g.id] as const))('%s has a CSS fallback the browser accepts', (id) => {
    const generator = GENERATORS[id]!
    const doc = assertAurora({ format: 'aurora', version: 1, name: id, palette: [...generator.palette], layers: [{ type: id }] })
    const css = compileCss(doc)
    const el = document.createElement('div')
    el.style.cssText = css.style
    if (css.backgroundImage === 'none') expect(id).toBe('grain')
    else expect(el.style.backgroundImage).not.toBe('')
  })
})
