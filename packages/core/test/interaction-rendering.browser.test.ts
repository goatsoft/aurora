import type { AuroraInput } from '@goatsoft/aurora-format'
import { assertAurora } from '@goatsoft/aurora-format'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadGenerators } from '@/generators/index'
import { InteractionState, resolveInteractionFrame } from '@/interaction-state'
import { compose } from '@/shader'
import { packUniforms } from '@/uniforms'
import { device, diff, render } from './gpu'

const W = 256
const H = 144
let gpu: GPUDevice
beforeAll(async () => {
  gpu = await device()
  await loadGenerators(['ping'])
})
afterAll(() => gpu.destroy())

const base: AuroraInput = { format: 'aurora', version: 1, name: 'Aurora follow', palette: ['#317ee8', '#a74ef5', '#ed45bc'], layers: [{ type: 'aurora-fbm' }] }

describe('interaction uniforms on WebGPU', () => {
  it('renders transparent Ping overlays without filling the canvas with the base colour', async () => {
    const doc = assertAurora({ ...base, layers: [{ type: 'ping', params: { background: 0 } }] })
    const shader = compose(doc)
    const pixels = await render(gpu, shader.code, packUniforms(doc, shader, { width: W, height: H, time: 2, scroll: 0 }), W, H)
    const alpha = pixels.filter((_, i) => i % 4 === 3)
    expect(Math.min(...alpha)).toBe(0)
    expect(Math.max(...alpha)).toBeGreaterThan(100)
    expect(diff(pixels, pixels).coverage).toBeGreaterThan(0.05)
    expect(diff(pixels, pixels).coverage).toBeLessThan(0.8)
  })

  it('keeps a configured scene at rest pixel-identical to the original and moves it without compiling another shader', async () => {
    const original = assertAurora(base)
    const doc = assertAurora({ ...base, interactions: [{ type: 'follow', smoothing: 0, bindings: [{ layer: 0, parameter: 'offsetX', input: 'x', amount: 0.2 }] }] })
    const shader = compose(doc)
    const originalShader = compose(original)
    const frame = { width: W, height: H, time: 3, scroll: 0 }
    const expected = await render(gpu, originalShader.code, packUniforms(original, originalShader, frame), W, H)
    const rest = await render(gpu, shader.code, packUniforms(doc, shader, frame), W, H)
    expect(diff(expected, rest).changed).toBe(0)
    const model = new InteractionState(doc.interactions![0]!)
    model.move(1, 0.5, 1000)
    const active = resolveInteractionFrame(doc, [model.frame(1000)])
    const pixels = await render(gpu, shader.code, packUniforms(active.doc, shader, { ...frame, transforms: active.transforms }), W, H)
    expect(diff(rest, pixels).changed).toBeGreaterThan(0.1)
    expect(compose(active.doc)).toBe(shader)
    const cloned = structuredClone(active)
    const worker = await render(gpu, shader.code, packUniforms(cloned.doc, shader, { ...frame, transforms: cloned.transforms }), W, H)
    expect(diff(pixels, worker).changed).toBe(0)
  })

  it('renders a travelling Ping from input while the ambient clock is frozen', async () => {
    const doc = assertAurora({ ...base, layers: [{ type: 'ping', opacity: 0 }], interactions: [{ type: 'impulse', decay: 2, bindings: [
      { layer: 0, parameter: 'x', input: 'x' }, { layer: 0, parameter: 'y', input: 'y' },
      { layer: 0, parameter: 'time', input: 'travel' }, { layer: 0, parameter: 'opacity', input: 'strength' },
    ] }] })
    const model = new InteractionState(doc.interactions![0]!)
    const shader = compose(doc)
    model.activate(0.3, 0.6, 1000)
    const pixels: Uint8Array[] = []
    for (const time of [1000, 1250, 1500]) {
      const active = resolveInteractionFrame(doc, [model.frame(time)])
      pixels.push(await render(gpu, shader.code, packUniforms(active.doc, shader, { width: W, height: H, time: 7, scroll: 0, transforms: active.transforms }), W, H))
    }
    expect(diff(pixels[0]!, pixels[1]!).changed).toBeGreaterThan(0.1)
    expect(diff(pixels[1]!, pixels[2]!).changed).toBeGreaterThan(0.1)
    const ended = resolveInteractionFrame(doc, [model.frame(3000)])
    const idle = await render(gpu, shader.code, packUniforms(ended.doc, shader, { width: W, height: H, time: 7, scroll: 0, transforms: ended.transforms }), W, H)
    expect(diff(idle, idle).coverage).toBe(0)
  })

  it('keeps transformed crops coherent across a shared scene', async () => {
    const doc = assertAurora({ ...base, interactions: [{ type: 'follow', bindings: [{ layer: 0, parameter: 'offsetX', input: 'x' }] }] })
    const shader = compose(doc)
    const transforms = [[0.1, -0.05, 0, 0] as const]
    const frame = { width: W, height: H, time: 2, scroll: 0, transforms }
    const whole = await render(gpu, shader.code, packUniforms(doc, shader, frame), W, H)
    const parts = await Promise.all(([0, 0.5] as const).map((x) => render(gpu, shader.code, packUniforms(doc, shader, { ...frame, rect: [x, 0, 0.5, 1] }), W / 2, H)))
    let changed = 0
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let k = 0; k < 4; k++) {
      const part = parts[x < W / 2 ? 0 : 1]!
      const px = x % (W / 2)
      if (Math.abs(part[(y * W / 2 + px) * 4 + k]! - whole[(y * W + x) * 4 + k]!) > 1) changed++
    }
    expect(changed / (W * H)).toBeLessThan(0.005)
  })
})
