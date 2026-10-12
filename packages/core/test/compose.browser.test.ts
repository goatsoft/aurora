import { assertAurora } from '@goatsoft/aurora-format'
import type { AuroraInput, BlendMode } from '@goatsoft/aurora-format'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { compose } from '@/compose'
import { registerGenerator } from '@/generators/index'
import { packUniforms } from '@/uniforms'
import { device, render } from './gpu'
import { solid } from './solid'

registerGenerator(solid)

const W = 64
const H = 64
let gpu: GPUDevice
beforeAll(async () => {
  gpu = await device()
})
afterAll(() => {
  gpu.destroy()
})

const doc = (layers: AuroraInput['layers'], extra: Partial<AuroraInput> = {}) =>
  assertAurora({ format: 'aurora', version: 1, name: 'T', palette: ['color(srgb 0.2 0.4 0.8)', 'color(srgb 0.9 0.6 0.1)'], layers, ...extra })

async function pixels(input: ReturnType<typeof doc>, output: 'srgb' | 'display-p3' = 'srgb') {
  const shader = compose(input, output)
  return render(gpu, shader.code, packUniforms(input, shader, { width: W, height: H, time: 3, scroll: 0 }), W, H)
}
const at = (p: Uint8Array, x: number, y: number) => [...p.subarray((y * W + x) * 4, (y * W + x) * 4 + 4)].map((v) => v / 255)

// Premultiplied source over destination, per mode, as CSS compositing defines it.
const s = [0.9 * 0.5, 0.6 * 0.5, 0.1 * 0.5, 0.5]
const d = [0.2 * 0.8, 0.4 * 0.8, 0.8 * 0.8, 0.8]
const union = s[3]! + d[3]! - s[3]! * d[3]!
const EXPECTED: Record<BlendMode, number[]> = {
  normal: [0, 1, 2].map((k) => s[k]! + d[k]! * (1 - s[3]!)).concat(union),
  screen: [0, 1, 2].map((k) => s[k]! + d[k]! - s[k]! * d[k]!).concat(union),
  add: [0, 1, 2].map((k) => Math.min(s[k]! + d[k]!, union)).concat(union),
  multiply: [0, 1, 2].map((k) => s[k]! * d[k]! + s[k]! * (1 - d[3]!) + d[k]! * (1 - s[3]!)).concat(union),
  overlay: [0, 1, 2].map((k) => {
    const mixed = 2 * d[k]! <= d[3]! ? 2 * s[k]! * d[k]! : s[3]! * d[3]! - 2 * (d[3]! - d[k]!) * (s[3]! - s[k]!)
    return mixed + s[k]! * (1 - d[3]!) + d[k]! * (1 - s[3]!)
  }).concat(union),
}

describe('composed shaders on the GPU', () => {
  it.each(Object.keys(EXPECTED) as BlendMode[])('blends "%s" like CSS compositing', async (blend) => {
    const p = await pixels(doc([
      { type: 'test-solid', params: { alpha: 0.8 }, colors: [0], mix: 'srgb' },
      { type: 'test-solid', blend, params: { alpha: 0.5 }, colors: [1], mix: 'srgb' },
    ]))
    expect(at(p, 10, 10)).toEqual(EXPECTED[blend].map((v): unknown => expect.closeTo(v, 2)))
  })

  it('applies layer opacity', async () => {
    const p = await pixels(doc([{ type: 'test-solid', opacity: 0.25, colors: [0], mix: 'srgb' }]))
    expect(at(p, 5, 5)[3]).toBeCloseTo(0.25, 2)
  })

  it('fades a linear mask from opaque to transparent along its angle', async () => {
    const p = await pixels(doc([{ type: 'test-solid', colors: [0], mask: { type: 'linear', angle: 180, start: 0.25, end: 0.5 } }]))
    expect(at(p, 32, 4)[3]).toBeCloseTo(1, 2)
    expect(at(p, 32, 60)[3]).toBe(0)
    const sideways = await pixels(doc([{ type: 'test-solid', colors: [0], mask: { type: 'linear', angle: 90, start: 0.25, end: 0.5 } }]))
    expect(at(sideways, 4, 32)[3]).toBeCloseTo(1, 2)
    expect(at(sideways, 60, 32)[3]).toBe(0)
  })

  it('fades a radial mask out from its centre', async () => {
    const p = await pixels(doc([{ type: 'test-solid', colors: [0], mask: { type: 'radial', start: 0, end: 0.6 } }]))
    expect(at(p, 32, 32)[3]).toBeGreaterThan(0.95)
    expect(at(p, 0, 0)[3]).toBe(0)
  })

  it('fades canvas edges', async () => {
    const p = await pixels(doc([{ type: 'test-solid', colors: [0] }], { canvas: { fade: 'y' } }))
    expect(at(p, 32, 0)[3]).toBeLessThan(0.05)
    expect(at(p, 32, 32)[3]).toBeCloseTo(1, 2)
  })

  it('renders OKLab colours to the same sRGB as the CPU', async () => {
    const p = await pixels(doc([{ type: 'test-solid', colors: [0] }]))
    expect(at(p, 1, 1).slice(0, 3)).toEqual([0.2, 0.4, 0.8].map((v): unknown => expect.closeTo(v, 2)))
  })

  it('re-encodes for a Display P3 canvas, in both mix spaces', async () => {
    for (const mix of ['oklab', 'srgb'] as const) {
      const p = await pixels(doc([{ type: 'test-solid', colors: [0], mix }]), 'display-p3')
      // sRGB (0.2, 0.4, 0.8) is roughly P3 (0.26, 0.39, 0.77): less blue, more red.
      const [r, g, b] = at(p, 1, 1)
      expect(r).toBeGreaterThan(0.22)
      expect(g).toBeCloseTo(0.39, 1)
      expect(b).toBeLessThan(0.8)
    }
  })

  it('draws the aurora in OKLab with premultiplied output', async () => {
    const p = await pixels(doc([{ type: 'aurora-fbm', params: { intensity: 1 } }], { palette: ['oklch(0.68 0.16 245)', 'oklch(0.56 0.22 285)', 'oklch(0.58 0.25 310)'] }))
    let ink = 0
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3]! > 0) ink++
      expect(Math.max(p[i]!, p[i + 1]!, p[i + 2]!)).toBeLessThanOrEqual(p[i + 3]! + 1)
    }
    expect(ink / (W * H)).toBeGreaterThan(0.1)
  })
})
