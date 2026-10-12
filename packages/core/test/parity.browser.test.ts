import type { AuroraDocument } from '@goatsoft/aurora-format'
import { assertAurora } from '@goatsoft/aurora-format'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { compose } from '@/shader'
import { packUniforms } from '@/uniforms'
import { CLASSIC_WGSL } from './fixtures/classic-aurora'
import { device, diff, render } from './gpu'

/**
 * PLAN.md Phase 2 parity: every classic preset renders bit-identically to the original shader in mix "srgb"
 * (PLAN allows 1%; we hold ourselves to zero differing pixels).
 * The reference options are restated from the original components, not derived from our presets.
 */
const presets = import.meta.glob<string>('~/presets/classic/*.aurora', { query: '?raw', import: 'default', eager: true })
const byName = Object.fromEntries(Object.entries(presets).map(([path, text]) => [path.replace(/^.*\/|\.aurora$/g, ''), text]))
const preset = (name: string): AuroraDocument => assertAurora(byName[name])

type Rgb = [number, number, number]
const PALETTES: Record<string, [Rgb, Rgb, Rgb]> = {
  blue: [[0.23, 0.63, 1.0], [0.48, 0.82, 1.0], [0.48, 0.36, 1.0]],
  violet: [[0.71, 0.29, 1.0], [0.48, 0.36, 1.0], [0.88, 0.55, 1.0]],
  indigo: [[0.48, 0.36, 1.0], [0.36, 0.62, 1.0], [0.66, 0.5, 1.0]],
  aurora: [[0.23, 0.63, 1.0], [0.48, 0.36, 1.0], [0.71, 0.29, 1.0]],
}
const lerp = (a: Rgb, b: Rgb, t: number) => a.map((v, k) => v + (b[k]! - v) * t) as Rgb
const download = (i: number) => [0, 1, 2].map((k) => lerp(PALETTES['blue']![k]!, PALETTES['violet']![k]!, i / 2)) as [Rgb, Rgb, Rgb]

interface ClassicOptions { colors: [Rgb, Rgb, Rgb], intensity: number, scale: number, speed: number, fade?: boolean, seed?: number, stretch?: number, sweep?: number }
const classic = (o: ClassicOptions) => ({ fade: false, seed: 0, stretch: 0.55, sweep: 0, ...o })

const USAGES: [string, ReturnType<typeof classic>, [number, number]][] = [
  ['ambient', classic({ colors: PALETTES['aurora']!, intensity: 0.18, scale: 1.0, speed: 0.04 }), [256, 160]],
  ['hero', classic({ colors: PALETTES['aurora']!, fade: true, intensity: 0.38, scale: 1.1, speed: 0.09, seed: 3, stretch: 0.45 }), [256, 144]],
  ['hero-touch', classic({ colors: PALETTES['aurora']!, fade: true, intensity: 0.56, scale: 1.6, speed: 0.09, seed: 3, stretch: 0.95 }), [256, 400]],
  ['pillar-blue', classic({ colors: PALETTES['blue']!, intensity: 0.6, scale: 1.5, speed: 0.06, seed: 1, stretch: 0.22 }), [256, 192]],
  ['pillar-violet', classic({ colors: PALETTES['violet']!, intensity: 0.6, scale: 1.5, speed: 0.06, seed: 7, stretch: 0.22 }), [256, 192]],
  ['pillar-indigo', classic({ colors: PALETTES['indigo']!, intensity: 0.6, scale: 1.5, speed: 0.06, seed: 13, stretch: 0.22 }), [256, 192]],
  ['stack-tile', classic({ colors: PALETTES['aurora']!, sweep: 1, intensity: 1.2, scale: 0.7, speed: 0.05, stretch: 0.4, seed: 3 }), [256, 256]],
  ['download-1', classic({ colors: download(0), intensity: 0.9, scale: 1.2, speed: 0.045, stretch: 0.9, seed: 11 }), [256, 256]],
  ['download-2', classic({ colors: download(1), intensity: 0.9, scale: 1.2, speed: 0.045, stretch: 0.9, seed: 18 }), [256, 256]],
  ['download-3', classic({ colors: download(2), intensity: 0.9, scale: 1.2, speed: 0.045, stretch: 0.9, seed: 25 }), [256, 256]],
  ['doc-dialog', classic({ colors: PALETTES['aurora']!, fade: true, intensity: 0.9, scale: 1.15, speed: 0.08, stretch: 0.5, seed: 21 }), [256, 160]],
  ['docs-page-dark', classic({ colors: PALETTES['aurora']!, intensity: 0.22, scale: 1.0, speed: 0.04 }), [256, 160]],
  ['docs-page-light', classic({ colors: PALETTES['aurora']!, intensity: 0.1, scale: 1.0, speed: 0.04 }), [256, 160]],
  ['docs-hero-dark', classic({ colors: PALETTES['aurora']!, fade: true, intensity: 0.3, scale: 1.1, speed: 0.09, seed: 3, stretch: 0.45 }), [256, 144]],
  ['docs-hero-light', classic({ colors: PALETTES['aurora']!, fade: true, intensity: 0.35, scale: 1.1, speed: 0.09, seed: 3, stretch: 0.45 }), [256, 144]],
]

/** The original 80-byte uniform block (fillAuroraUniforms). */
function classicUniforms(o: ReturnType<typeof classic>, width: number, height: number, time: number, scroll: number): Float32Array<ArrayBuffer> {
  return new Float32Array([
    width, height, time, scroll,
    ...o.colors[0], o.intensity, ...o.colors[1], o.scale, ...o.colors[2], o.speed,
    o.fade ? 1 : 0, o.seed, o.stretch, o.sweep,
  ])
}

let gpu: GPUDevice
beforeAll(async () => {
  gpu = await device()
})
afterAll(() => {
  gpu.destroy()
})

describe('classic parity (mix: "srgb")', () => {
  it('covers every classic preset file', () => {
    expect(Object.keys(byName).sort()).toEqual(USAGES.map(([n]) => n).sort())
  })

  it.each(USAGES)('%s renders identically to the original shader', async (name, options, [width, height]) => {
    // The original applies the download cards' fade as a CSS mask on top of the canvas, so compare without it.
    const doc = preset(name)
    const unmasked = { ...doc, layers: doc.layers.map(({ mask, ...layer }) => layer) }
    const shader = compose(unmasked)
    for (const [time, scroll] of [[0, 0], [12.5, 0], [97.25, 0.3]] as const) {
      const expected = await render(gpu, CLASSIC_WGSL, classicUniforms(options, width, height, time, scroll), width, height)
      const actual = await render(gpu, shader.code, packUniforms(unmasked, shader, { width, height, time, scroll }), width, height)
      const result = diff(expected, actual)
      expect(result.coverage, `${name} should draw something`).toBeGreaterThan(0.05)
      expect(result.changed, `${name} at t=${time}: ${(result.changed * 100).toFixed(3)}% of pixels differ (max ${result.max})`).toBe(0)
    }
  })
})
