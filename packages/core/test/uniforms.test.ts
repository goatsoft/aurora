import type { AuroraInput } from '@goatsoft/aurora-format'
import { assertAurora } from '@goatsoft/aurora-format'
import { gamutMap, parseColor, rgbToOklab } from '@goatsoft/color'
import { describe, expect, it } from 'vitest'
import { auroraFbm } from '@/generators/index'
import { compose } from '@/shader'
import { colorIndices, packUniforms, paramValue, shaderColor } from '@/uniforms'

const doc = (layers: AuroraInput['layers'], extra: Partial<AuroraInput> = {}) =>
  assertAurora({ format: 'aurora', version: 1, name: 'T', palette: ['color(srgb 0.23 0.63 1)', '#7a5cff', 'oklch(0.7 0.3 150)'], layers, ...extra })
const f32 = (values: number[]) => [...new Float32Array(values)]

describe('packUniforms', () => {
  it('writes the frame, scaling time by motion speed', () => {
    const d = doc([{ type: 'aurora-fbm' }], { motion: { speed: 2 } })
    const u = packUniforms(d, compose(d), { width: 320, height: 180, time: 1.5, scroll: 0.25, rect: [0.5, 0, 0.5, 1] })
    expect([...u.subarray(0, 8)]).toEqual([320, 180, 3, 0.25, 0.5, 0, 0.5, 1])
    expect([...packUniforms(d, compose(d), { width: 1, height: 1, time: 0, scroll: 0 }).subarray(4, 8)]).toEqual([0, 0, 1, 1])
  })

  it('writes opacity, params (with defaults) and colours', () => {
    const d = doc([{ type: 'aurora-fbm', opacity: 0.5, params: { intensity: 0.38, seed: 3, sweep: true }, mix: 'srgb' }])
    const u = packUniforms(d, compose(d), { width: 1, height: 1, time: 0, scroll: 0 })
    expect([...u.subarray(8, 16)]).toEqual(f32([0.5, 0.38, 1.6, 0.06, 3, 0.55, 1, 0]))
    expect([...u.subarray(16, 19)]).toEqual(f32([0.23, 0.63, 1]))
  })

  it('writes mask values', () => {
    const d = doc([{ type: 'aurora-fbm', mask: { type: 'linear', angle: 90, start: 0.1, end: 0.9 } }, { type: 'aurora-fbm', mask: { type: 'radial', x: 0.3 } }])
    const shader = compose(d)
    const u = packUniforms(d, shader, { width: 1, height: 1, time: 0, scroll: 0 })
    const linear = [...u.subarray(shader.layers[0]!.mask! * 4, shader.layers[0]!.mask! * 4 + 4)]
    expect(linear[0]).toBeCloseTo(1, 6)
    expect(linear[1]).toBeCloseTo(0, 6)
    expect(linear.slice(2)).toEqual(f32([0.1, 0.9]))
    expect([...u.subarray(shader.layers[1]!.mask! * 4, shader.layers[1]!.mask! * 4 + 4)]).toEqual(f32([0.3, 0.5, 0, 1]))
  })

  it('reuses an output array of the right size', () => {
    const d = doc([{ type: 'aurora-fbm' }])
    const shader = compose(d)
    const out = new Float32Array(shader.slots * 4)
    expect(packUniforms(d, shader, { width: 1, height: 1, time: 0, scroll: 0 }, out)).toBe(out)
    expect(packUniforms(d, shader, { width: 1, height: 1, time: 0, scroll: 0 }, new Float32Array(4))).toHaveLength(shader.slots * 4)
  })
})

describe('colours', () => {
  it('keeps sRGB colours exact for mix "srgb"', () => {
    expect(shaderColor('color(srgb 0.23 0.63 1)', 'srgb', 'srgb').map((v) => Number(v.toFixed(12)))).toEqual([0.23, 0.63, 1])
  })

  it('gamut-maps OKLab colours into the output space', () => {
    const vivid = 'oklch(0.7 0.3 150)'
    const lab = parseColor(vivid)
    if (!lab.ok) throw new Error(lab.message)
    const expected = rgbToOklab(gamutMap(lab.color, 'srgb'))
    expect(shaderColor(vivid, 'oklab', 'srgb')).toEqual([expected.l, expected.a, expected.b])
    // Display P3 holds more chroma than sRGB.
    const chroma = (v: number[]) => Math.hypot(v[1]!, v[2]!)
    expect(chroma(shaderColor(vivid, 'oklab', 'display-p3'))).toBeGreaterThan(chroma(shaderColor(vivid, 'oklab', 'srgb')))
  })

  it('throws on colours the format would reject', () => {
    expect(() => shaderColor('nope', 'oklab', 'srgb')).toThrow('"nope" is not a colour.')
  })

  it('picks palette indices: explicit and cycled, or the palette in order', () => {
    const layer = (colors: number[]) => doc([{ type: 'aurora-fbm', colors }]).layers[0]!
    expect(colorIndices(layer([]), auroraFbm, 3)).toEqual([0, 1, 2])
    expect(colorIndices(layer([]), auroraFbm, 2)).toEqual([0, 1, 0])
    expect(colorIndices(layer([2, 1]), auroraFbm, 3)).toEqual([2, 1, 2])
  })

  it('reads params, falling back to defaults for non-numbers', () => {
    const layer = doc([{ type: 'aurora-fbm', params: { seed: 4, sweep: false, scale: 'big' } }]).layers[0]!
    expect(paramValue(layer, auroraFbm, 'seed')).toBe(4)
    expect(paramValue(layer, auroraFbm, 'sweep')).toBe(0)
    expect(paramValue(layer, auroraFbm, 'scale')).toBe(1.6)
    expect(paramValue(layer, auroraFbm, 'intensity')).toBe(1)
  })
})

describe('signal effect uniforms', () => {
  it('bypasses signal distortion for reduced motion and restores the authored amount', () => {
    const input = doc([{ type: 'aurora-fbm' }], { modifiers: { signal: { amount: 0.7 }, pixelate: { size: 8 }, vignette: {} } })
    const shader = compose(input)
    const out = packUniforms(input, shader, { width: 200, height: 100, time: 1, scroll: 0, reduced: true })
    expect(out[shader.signal! * 4]).toBe(0)
    expect(out[shader.pixelate! * 4]).toBe(8)
    packUniforms(input, shader, { width: 200, height: 100, time: 1, scroll: 0, reduced: false }, out)
    expect(out[shader.signal! * 4]).toBeCloseTo(0.7)
    expect(input.modifiers!.signal!.amount).toBe(0.7)
  })
  it('updates every control in place, including zeros, without rebuilding the shader', () => {
    const input = doc([{ type: 'aurora-fbm' }], { modifiers: { signal: { amount: 0.7, shake: 0.6, tearSize: 0.2, separation: 0.4, tracking: 0.3, frequency: 0.8, seed: 19 } } })
    const shader = compose(input)
    const out = packUniforms(input, shader, { width: 200, height: 100, time: 1, scroll: 0 })
    expect([...out.subarray(shader.signal! * 4)]).toEqual(f32([0.7, 0.6, 0.2, 0.4, 0.3, 0.8, 19, 0]))
    const zero = assertAurora({ ...input, modifiers: { signal: { amount: 0, shake: 0, tearSize: 0.02, separation: 0, tracking: 0, frequency: 0, seed: 0 } } })
    expect(packUniforms(zero, shader, { width: 200, height: 100, time: 1, scroll: 0 }, out)).toBe(out)
    expect([...out.subarray(shader.signal! * 4)]).toEqual(f32([0, 0, 0.02, 0, 0, 0, 0, 0]))
  })
})
