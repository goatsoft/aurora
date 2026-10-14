import type { AuroraDocument, AuroraInput } from '@goatsoft/aurora-format'
import { assertAurora } from '@goatsoft/aurora-format'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { compose as composeSpecs } from '@/compose'
import { defineGenerator, generatorSpec } from '@/generators/define'
import { GENERATORS, loadGenerators, registerGenerator } from '@/generators/index'
import { compose } from '@/shader'
import { packUniforms } from '@/uniforms'
import signalLost from '~/presets/scenes/signal-lost.aurora?raw'
import { expectGolden } from './golden'
import { device, diff, render } from './gpu'

const pattern = defineGenerator({
  id: 'test-signal-pattern', label: 'Pattern', description: 'A static spatial reference.', colors: 1, palette: ['#fff'], params: { unused: { default: 0, min: 0, max: 1, step: 1, label: 'Unused', description: 'Test padding.' } },
  wgsl: 'fn render(ctx: Ctx, P: Params, c: array<vec3f, 1>) -> vec4f { return vec4f(ctx.uv.x, ctx.uv.y, step(0.5, fract(ctx.uv.x * 6.0)), 1.0); }',
  css: () => [],
})
registerGenerator(pattern)
await loadGenerators()
let gpu: GPUDevice
beforeAll(async () => { gpu = await device() })
afterAll(() => { gpu.destroy() })
const base: AuroraInput = { format: 'aurora', version: 1, name: 'Signal', palette: ['#fff'], layers: [{ type: pattern.id, mix: 'srgb' }] }
const effected = (signal: NonNullable<NonNullable<AuroraInput['modifiers']>['signal']> = {}) => assertAurora({ ...base, modifiers: { signal } })
async function frame(doc: AuroraDocument, time = 0.5, width = 192, height = 108, rect?: readonly [number, number, number, number]) {
  const shader = compose(doc)
  return render(gpu, shader.code, packUniforms(doc, shader, { width: rect ? width * 2 : width, height, time, scroll: 0, ...(rect ? { rect } : {}) }), width, height)
}

describe('scene-wide signal distortion', () => {
  it('is bit-exact with the original scene at zero amount', async () => {
    expect(diff(await frame(assertAurora(base)), await frame(effected({ amount: 0 }))).changed).toBe(0)
  })
  it('warps actual scene content deterministically and changes during a burst', async () => {
    const doc = effected({ amount: 1, frequency: 1, shake: 1, tracking: 1 })
    const a = await frame(doc, 0.25)
    expect(diff(a, await frame(doc, 0.25)).changed).toBe(0)
    expect(diff(a, await frame(assertAurora(base), 0.25)).changed).toBeGreaterThan(0.1)
    expect(diff(a, await frame(doc, 0.29)).changed).toBeGreaterThan(0.1)
  })
  it('freezes through both document motion and effect frequency', async () => {
    for (const doc of [effected({ frequency: 0 }), assertAurora({ ...effected(), motion: { speed: 0 } })]) {
      expect(diff(await frame(doc, 0), await frame(doc, 8)).changed).toBe(0)
    }
  })
  it.each(['shake', 'tracking', 'tearSize', 'separation', 'seed'] as const)('responds to %s independently', async (key) => {
    const low = key === 'tearSize' ? 0.02 : 0
    const high = key === 'tearSize' ? 0.5 : key === 'seed' ? 19 : 1
    expect(diff(await frame(effected({ amount: 1, frequency: 1, [key]: low }), 0.25), await frame(effected({ amount: 1, frequency: 1, [key]: high }), 0.25)).changed).toBeGreaterThan(0.005)
  })
  it('keeps shared-scene crops continuous', async () => {
    const doc = effected({ amount: 0.8 })
    const full = await frame(doc)
    const right = await frame(doc, 0.5, 96, 108, [0.5, 0, 0.5, 1])
    const crop = new Uint8Array(right.length)
    for (let y = 0; y < 108; y++) crop.set(full.subarray((y * 192 + 96) * 4, (y + 1) * 192 * 4), y * 96 * 4)
    expect(diff(right, crop).changed).toBe(0)
  })
  it('keeps separated transparent edges premultiplied', async () => {
    const doc = assertAurora({ ...effected({ amount: 1, separation: 1 }), canvas: { fade: 'y' }, layers: [{ type: pattern.id, mix: 'srgb', opacity: 0.5, mask: { type: 'radial' } }] })
    const pixels = await frame(doc)
    for (let i = 0; i < pixels.length; i += 4) for (let k = 0; k < 3; k++) expect(pixels[i + k]!).toBeLessThanOrEqual(pixels[i + 3]! + 1)
  })
  it('renders the worker structured-cloned document and specs identically', async () => {
    const doc = assertAurora(signalLost)
    const copy = structuredClone(doc)
    const specs = new Map(copy.layers.map((layer) => [layer.type, structuredClone(generatorSpec(GENERATORS[layer.type]!))]))
    copy.layers = copy.layers.map((layer) => ({ ...layer, type: `worker-${layer.type}` }))
    const shader = composeSpecs(copy, 'srgb', (id) => ({ ...specs.get(id.slice(7))!, id }))
    const pixels = await render(gpu, shader.code, packUniforms(copy, shader, { width: 192, height: 108, time: 0.5, scroll: 0 }), 192, 108)
    expect(diff(pixels, await frame(doc)).changed).toBe(0)
  })
  it('has reviewed Signal Lost motion at three aspect ratios', async () => {
    const doc = assertAurora(signalLost)
    const sheet = new Uint8Array(1536 * 616 * 4)
    for (let i = 3; i < sheet.length; i += 4) sheet[i] = 255
    let top = 0
    for (const [width, height] of [[384, 216], [144, 256], [512, 144]] as const) {
      for (const [column, time] of [0, 0.4, 0.48].entries()) {
        const pixels = await frame(doc, time, width, height)
        for (let y = 0; y < height; y++) sheet.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), ((top + y) * 1536 + column * 512) * 4)
      }
      top += height
    }
    await expectGolden('signal-lost-distortion-motion', sheet, 1536, 616)
  })
})

describe('Pixelate and Vignette', () => {
  it('makes uniform display blocks, with size one bit-exact to the original', async () => {
    const doc = assertAurora({ ...base, modifiers: { pixelate: { size: 8 } } })
    const pixels = await frame(doc)
    const pixel = (x: number, y: number) => [...pixels.subarray((y * 192 + x) * 4, (y * 192 + x + 1) * 4)]
    expect(pixel(0, 0)).toEqual(pixel(7, 7))
    expect(pixel(0, 0)).not.toEqual(pixel(8, 0))
    expect(diff(await frame(assertAurora(base)), await frame(assertAurora({ ...base, modifiers: { pixelate: { size: 1 } } }))).changed).toBe(0)
  })
  it('darkens edges without changing alpha and bypasses at zero strength', async () => {
    const plain = await frame(assertAurora(base))
    const shaded = await frame(assertAurora({ ...base, modifiers: { vignette: { amount: 0.9, radius: 0.3, softness: 0.4 } } }))
    const center = (54 * 192 + 96) * 4
    expect([...shaded.subarray(center, center + 4)]).toEqual([...plain.subarray(center, center + 4)])
    expect(shaded[(10 * 192 + 180) * 4]!).toBeLessThan(plain[(10 * 192 + 180) * 4]!)
    expect(Array.from(shaded).filter((_, i) => i % 4 === 3)).toEqual(Array.from(plain).filter((_, i) => i % 4 === 3))
    expect(diff(plain, await frame(assertAurora({ ...base, modifiers: { vignette: { amount: 0 } } }))).changed).toBe(0)
  })
  it('composes every modifier at its maximum on a tiny canvas', async () => {
    const doc = assertAurora({ ...base, modifiers: { signal: { amount: 1, shake: 1, tearSize: 0.5, separation: 1, tracking: 1, frequency: 2, seed: 100 }, pixelate: { size: 64 }, vignette: { amount: 1, radius: 0, softness: 0.01 } } })
    expect(await frame(doc, 0.25, 32, 18)).toHaveLength(32 * 18 * 4)
  })
  it('keeps all three modifiers continuous across shared panels', async () => {
    const doc = assertAurora({ ...base, modifiers: { signal: {}, pixelate: { size: 7 }, vignette: {} } })
    const full = await frame(doc)
    const right = await frame(doc, 0.5, 96, 108, [0.5, 0, 0.5, 1])
    const crop = new Uint8Array(right.length)
    for (let y = 0; y < 108; y++) crop.set(full.subarray((y * 192 + 96) * 4, (y + 1) * 192 * 4), y * 96 * 4)
    expect(diff(right, crop).changed).toBe(0)
  })
})
