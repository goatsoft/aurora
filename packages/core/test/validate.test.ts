import type { AuroraInput } from '@goatsoft/aurora-format'
import { assertAurora, MODIFIERS } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { validateDocument } from '@/validate'

const doc = (layers: AuroraInput['layers']) => assertAurora({ format: 'aurora', version: 1, name: 'T', palette: ['#fff'], layers })

describe('validateDocument', () => {
  it.each(['follow', 'grab'] as const)('explains inert %s binding combinations', async (type) => {
    const source = assertAurora({ ...doc([{ type: 'aurora-fbm' }]), modifiers: { signal: {} }, interactions: [{ type, bindings: [
      { layer: 0, parameter: 'opacity', input: 'travel', slot: 1 },
      { layer: 0, parameter: 'signal.amount', input: 'strength' },
    ] }] })
    expect(await validateDocument(source)).toEqual([
      { path: '$.interactions[0].bindings[0].slot', message: `must be 0 for a ${type} interaction; only impulse interactions have multiple samples.` },
      { path: '$.interactions[0].bindings[0].input', message: `must not be "travel" for a ${type} interaction; only impulse interactions emit elapsed time.` },
      { path: '$.interactions[0].bindings[1].layer', message: 'must be omitted for a signal modifier binding.' },
    ])
  })

  it('accepts every shared signal control and multiple impulse samples, excluding inherited keys', async () => {
    const source = doc([{ type: 'aurora-fbm' }])
    for (const parameter of Object.keys(MODIFIERS.signal.controls)) {
      expect(await validateDocument(assertAurora({ ...source, modifiers: { signal: {} }, interactions: [{ type: 'impulse', bindings: [{ parameter: `signal.${parameter}`, input: 'travel', slot: 3 }] }] }))).toEqual([])
    }
    expect(await validateDocument(assertAurora({ ...source, modifiers: { signal: {} }, interactions: [{ type: 'follow', bindings: [{ parameter: 'signal.__proto__', input: 'x' }] }] }))).toEqual([{ path: '$.interactions[0].bindings[0].parameter', message: 'is not a signal control: "signal.__proto__".' }])
  })

  it('checks interaction bindings against existing layers and controls', async () => {
    const source = doc([{ type: 'aurora-fbm' }])
    const interaction = (parameter: string, layer?: number) => assertAurora({ ...source, interactions: [{ type: 'follow', bindings: [{ parameter, input: 'x', ...(layer === undefined ? {} : { layer }) }] }] })
    expect(await validateDocument(interaction('offsetX', 0))).toEqual([])
    expect(await validateDocument(interaction('intensity', 0))).toEqual([])
    expect(await validateDocument(interaction('__proto__', 0))).toEqual([{ path: '$.interactions[0].bindings[0].parameter', message: 'is not a parameter of aurora-fbm.' }])
    expect(await validateDocument(interaction('sped', 0))).toEqual([{ path: '$.interactions[0].bindings[0].parameter', message: 'is not a parameter of aurora-fbm. Did you mean "speed"?' }])
    expect(await validateDocument(interaction('x', 1))).toEqual([{ path: '$.interactions[0].bindings[0].layer', message: 'must reference an existing layer (0–0).' }])
    expect(await validateDocument(interaction('intensity'))).toEqual([{ path: '$.interactions[0].bindings[0].layer', message: 'must reference an existing layer (0–0).' }])
    expect(await validateDocument(interaction('signal.amount'))).toEqual([{ path: '$.interactions[0].bindings[0].parameter', message: 'requires a signal modifier in $.modifiers.signal.' }])
    const signal = assertAurora({ ...interaction('signal.nope'), modifiers: { signal: {} } })
    expect(await validateDocument(signal)).toEqual([{ path: '$.interactions[0].bindings[0].parameter', message: 'is not a signal control: "signal.nope".' }])
    expect(await validateDocument(assertAurora({ ...interaction('signal.amount'), modifiers: { signal: {} } }))).toEqual([])
  })

  it('accepts known generators and params', async () => {
    expect(await validateDocument(doc([{ type: 'aurora-fbm', params: { seed: 3, sweep: true } }]))).toEqual([])
  })

  const cases: [AuroraInput['layers'], string, string][] = [
    [[{ type: 'aurora-fmb' }], '$.layers[0].type', 'is not a known generator. Did you mean "aurora-fbm"?'],
    [[{ type: 'nebula' }], '$.layers[0].type', 'is not a known generator. Available: aurora-fbm, curtain, starfield, linear-gradient, linear-sweep, conic, mesh-gradient, clouds, wind, rain, lightning, mountains, treeline, strata, water, fire, grain, digital-rain, glitch, static, radar, scanlines, phosphor, ping.'],
    [[{ type: 'aurora-fbm', params: { sped: 1 } }], '$.layers[0].params.sped', 'is not a parameter of aurora-fbm. Did you mean "speed"?'],
    [[{ type: 'aurora-fbm', params: { 'my param': 1 } }], '$.layers[0].params["my param"]', 'is not a parameter of aurora-fbm. Expected one of: intensity, scale, speed, seed, stretch, sweep.'],
    [[{ type: 'aurora-fbm', params: { seed: 'x' } }], '$.layers[0].params.seed', 'must be a number, got "x".'],
    [[{ type: 'aurora-fbm', params: { intensity: 3 } }], '$.layers[0].params.intensity', 'must be between 0 and 2, got 3.'],
  ]
  it.each(cases)('explains %j', async (layers, path, message) => {
    expect(await validateDocument(doc(layers))).toEqual([{ path, message }])
  })
})

describe('registerGenerator', () => {
  it('rejects bad ids, clashes and generators without render()', async () => {
    const { registerGenerator, GENERATORS } = await import('@/generators/index')
    const { solid } = await import('./solid')
    registerGenerator(solid)
    registerGenerator(solid)
    expect(GENERATORS['test-solid']).toBe(solid)
    expect(() => {
      registerGenerator({ ...solid, id: 'Bad' })
    }).toThrow('Generator id "Bad" must be kebab-case, like "aurora-fbm".')
    expect(() => {
      registerGenerator({ ...solid })
    }).toThrow('A different generator is already registered as "test-solid".')
    expect(() => {
      registerGenerator({ ...solid, id: 'no-render', wgsl: 'fn draw() {}' })
    }).toThrow('Generator "no-render" must define fn render(')
  })
})
