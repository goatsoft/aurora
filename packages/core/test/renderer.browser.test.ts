import type { SurfaceState } from '@/protocol'
import { assertAurora } from '@goatsoft/aurora-format'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { GENERATORS } from '@/generators/index'
import { Renderer } from '@/renderer'
import { compose } from '@/shader'
import { packUniforms } from '@/uniforms'
import { device, diff, render, TextureCanvas } from './gpu'

const hero = assertAurora(Object.values(import.meta.glob<string>('~/presets/classic/hero.aurora', { query: '?raw', import: 'default', eager: true }))[0])
const W = 256
const H = 144
const state = (overrides: Partial<SurfaceState> = {}): SurfaceState => ({
  doc: hero,
  width: W,
  height: H,
  scene: { width: W, height: H, rect: [0, 0, 1, 1] },
  scroll: 0,
  visible: true,
  reduced: 'still',
  origin: 0,
  output: 'srgb',
  ...overrides,
})

let reference: GPUDevice
beforeAll(async () => {
  reference = await device()
})
afterAll(() => {
  reference.destroy()
})

async function frame(renderer: Renderer, frames: ReturnType<typeof vi.fn>, id: number, canvas: TextureCanvas, s: SurfaceState) {
  renderer.attach(id, canvas as unknown as OffscreenCanvas, s)
  await vi.waitFor(() => expect(frames).toHaveBeenCalledWith(id), { timeout: 5000 })
  return canvas.pixels()
}

describe('Renderer on a real GPU', () => {
  it('renders exactly what the composed shader renders, and reports the frame after completion', async () => {
    const frames = vi.fn()
    const renderer = await Renderer.create(navigator.gpu, { frame: frames, fail: vi.fn() }, { fps: 60, generators: (id) => GENERATORS[id] })
    const actual = await frame(renderer, frames, 1, new TextureCanvas(), state())
    const shader = compose(hero)
    const expected = await render(reference, shader.code, packUniforms(hero, shader, { width: W, height: H, time: 0, scroll: 0 }), W, H)
    expect(diff(expected, actual)).toMatchObject({ changed: 0 })
    expect(diff(expected, actual).coverage).toBeGreaterThan(0.05)
    expect(renderer.stats.frames).toBeGreaterThanOrEqual(1)
    renderer.fail()
  })

  it('renders scene members as one continuous field', async () => {
    const frames = vi.fn()
    const renderer = await Renderer.create(navigator.gpu, { frame: frames, fail: vi.fn() }, { fps: 60, generators: (id) => GENERATORS[id] })
    const half = W / 2
    const left = await frame(renderer, frames, 1, new TextureCanvas(), state({ width: half, scene: { width: W, height: H, rect: [0, 0, 0.5, 1] } }))
    const right = await frame(renderer, frames, 2, new TextureCanvas(), state({ width: half, scene: { width: W, height: H, rect: [0.5, 0, 0.5, 1] } }))
    const whole = await frame(renderer, frames, 3, new TextureCanvas(), state())
    let mismatched = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const part = x < half ? left : right
        const px = x < half ? x : x - half
        for (let k = 0; k < 4; k++) if (Math.abs(part[(y * half + px) * 4 + k]! - whole[(y * W + x) * 4 + k]!) > 1) mismatched++
      }
    }
    expect(mismatched / (W * H)).toBeLessThan(0.005)
    renderer.fail()
  })
})
