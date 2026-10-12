import { describe, expect, it } from 'vitest'
import { NOISE, noiseWgsl } from '@/generators/noise'

describe('noiseWgsl', () => {
  it('includes dependencies first, each once', () => {
    const code = noiseWgsl(['curl', 'fbm', 'value'])
    const order = ['fn noise_pcg2', 'fn noise_simplex', 'fn noise_fbm', 'fn noise_curl', 'fn noise_value'].map((s) => code.indexOf(s))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].slice(0, 4)).toEqual([...order].slice(0, 4).sort((a, b) => a - b))
    expect(code.match(/fn noise_pcg2/g)).toHaveLength(1)
    expect(noiseWgsl([])).toBe('')
  })

  it('prefixes every function', () => {
    for (const { wgsl } of Object.values(NOISE)) {
      for (const [, name] of wgsl.matchAll(/\bfn (\w+)/g)) expect(name).toMatch(/^noise_/)
    }
  })
})
