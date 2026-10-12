import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { distance, jsonPath, keysAt, suggest, toFormatIssue } from '@/issues'
import { AuroraSchema } from '@/schema'

describe('jsonPath', () => {
  it('uses dot, index and quoted notation', () => {
    expect(jsonPath([])).toBe('$')
    expect(jsonPath(['layers', 0, 'params', 'seed'])).toBe('$.layers[0].params.seed')
    expect(jsonPath(['params', 'my key', '$schema'])).toBe('$.params["my key"].$schema')
  })
})

describe('suggestions', () => {
  it('measures edit distance', () => {
    expect(distance('', 'abc')).toBe(3)
    expect(distance('blnd', 'blend')).toBe(1)
    expect(distance('kitten', 'sitting')).toBe(3)
  })

  it('suggests only plausible typos', () => {
    expect(suggest('Screen', ['normal', 'screen'])).toBe('screen')
    expect(suggest('opactiy', ['opacity', 'params'])).toBe('opacity')
    expect(suggest('zzzzzz', ['opacity'])).toBeUndefined()
    expect(suggest('z', ['x', 'y'])).toBeUndefined()
    expect(suggest('x', [])).toBeUndefined()
  })
})

describe('keysAt', () => {
  const doc = { layers: [{ type: 'a', mask: { type: 'radial' }, params: { seed: 1 } }] }

  it('walks objects, arrays, optionals and variants', () => {
    expect(keysAt(AuroraSchema, doc, [])).toContain('palette')
    expect(keysAt(AuroraSchema, doc, ['layers', 0])).toContain('blend')
    expect(keysAt(AuroraSchema, doc, ['layers', 0, 'mask'])).toEqual(['type', 'x', 'y', 'start', 'end'])
    expect(keysAt(AuroraSchema, doc, ['canvas'])).toEqual(['fade', 'fixed', 'parallax'])
  })

  it('returns no keys where there are none', () => {
    expect(keysAt(AuroraSchema, doc, ['layers', 0, 'params', 'seed'])).toEqual([])
    expect(keysAt(AuroraSchema, doc, ['nope'])).toEqual([])
  })
})

describe('toFormatIssue', () => {
  it('handles root-level issues without a path', () => {
    const result = v.safeParse(AuroraSchema, 'nope')
    expect(result.success).toBe(false)
    expect(toFormatIssue(result.issues![0], AuroraSchema, 'nope')).toEqual({ path: '$', message: 'must be an object, got "nope".' })
  })
})
