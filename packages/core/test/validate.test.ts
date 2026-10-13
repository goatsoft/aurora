import type { AuroraInput } from '@goatsoft/aurora-format'
import { assertAurora } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { validateDocument } from '@/validate'

const doc = (layers: AuroraInput['layers']) => assertAurora({ format: 'aurora', version: 1, name: 'T', palette: ['#fff'], layers })

describe('validateDocument', () => {
  it('accepts known generators and params', async () => {
    expect(await validateDocument(doc([{ type: 'aurora-fbm', params: { seed: 3, sweep: true } }]))).toEqual([])
  })

  const cases: [AuroraInput['layers'], string, string][] = [
    [[{ type: 'aurora-fmb' }], '$.layers[0].type', 'is not a known generator. Did you mean "aurora-fbm"?'],
    [[{ type: 'nebula' }], '$.layers[0].type', 'is not a known generator. Available: aurora-fbm, curtain, starfield, linear-gradient, linear-sweep, conic, mesh-gradient, clouds, wind, rain, lightning, mountains, treeline, strata, water, fire, grain.'],
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
