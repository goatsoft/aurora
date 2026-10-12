import { describe, expect, it } from 'vitest'
import { FORMAT_VERSION, hasWebGPU } from '../src/index.ts'

describe('@goatsoft/aurora', () => {
  it('re-exports the format version', () => {
    expect(FORMAT_VERSION).toBe(1)
  })

  it('reports no WebGPU outside a browser', () => {
    expect(hasWebGPU()).toBe(false)
  })
})
