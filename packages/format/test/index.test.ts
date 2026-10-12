import { describe, expect, it } from 'vitest'
import { FORMAT_ID, FORMAT_VERSION } from '../src/index.ts'

describe('@goatsoft/aurora-format', () => {
  it('exposes the format identity', () => {
    expect(FORMAT_ID).toBe('aurora')
    expect(FORMAT_VERSION).toBe(1)
  })
})
