import { assertAurora } from '@goatsoft/aurora-format'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadGenerators } from '@/generators/index'
import { InteractionState, resolveInteractionFrame } from '@/interaction-state'
import { compose } from '@/shader'
import { packUniforms } from '@/uniforms'
import { validateDocument } from '@/validate'
import { expectGolden } from './golden'
import { device, diff, render } from './gpu'

const scenes = import.meta.glob<string>('~/presets/interactions/*.aurora', { query: '?raw', import: 'default', eager: true })
const W = 384
const H = 216
let gpu: GPUDevice
beforeAll(async () => {
  gpu = await device()
  await loadGenerators()
})
afterAll(() => gpu.destroy())

describe('interactive scene presets', () => {
  it.each(Object.entries(scenes).map(([path, text]) => [path.split('/').pop()!.replace('.aurora', ''), text]))('%s has valid, art-directed rest and motion frames', async (id, text) => {
    const doc = assertAurora(text)
    expect(await validateDocument(doc)).toEqual([])
    const before = structuredClone(doc)
    const shader = compose(doc)
    const rest = await render(gpu, shader.code, packUniforms(doc, shader, { width: W, height: H, time: 6.5, scroll: 0 }), W, H)
    await expectGolden(`interaction-${id}-rest`, rest, W, H)
    const models = doc.interactions!.map((config) => new InteractionState(config))
    for (const model of models) {
      if (model.config.type === 'follow') model.move(0.8, 0.25, 1100)
      else if (model.config.type === 'impulse') model.activate(0.3, 0.6, 1100)
      else {
        model.grab(0.5, 0.5, 1000)
        model.move(0.8, 0.38, 1100)
        model.release(1100)
      }
    }
    const frames: Uint8Array[] = []
    for (const time of [1267, 1434, 1601]) {
      const resolved = resolveInteractionFrame(doc, models.map((model) => model.frame(time)))
      expect(compose(resolved.doc)).toBe(shader)
      frames.push(await render(gpu, shader.code, packUniforms(resolved.doc, shader, { width: W, height: H, time: 6.5 + (time - 1100) / 1000, scroll: 0, transforms: resolved.transforms }), W, H))
    }
    expect(diff(rest, frames[1]!).changed).toBeGreaterThan(0.005)
    expect(diff(frames[0]!, frames[2]!).changed).toBeGreaterThan(0.005)
    const sheet = new Uint8Array(W * 3 * H * 4)
    for (let y = 0; y < H; y++) for (let i = 0; i < frames.length; i++) sheet.set(frames[i]!.subarray(y * W * 4, (y + 1) * W * 4), (y * W * 3 + i * W) * 4)
    await expectGolden(`interaction-${id}-motion`, sheet, W * 3, H)
    expect(doc).toEqual(before)
  }, 15_000)
})
