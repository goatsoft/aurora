import { describe, expect, it } from 'vitest'
import { COLOR_WGSL } from '@/index'

describe('COLOR_WGSL', () => {
  it('declares every function and writes valid float literals', () => {
    for (const name of ['color_srgb_encode', 'color_srgb_decode', 'color_oklab_to_linear_srgb', 'color_oklab_to_linear_p3', 'color_linear_srgb_to_linear_p3']) {
      expect(COLOR_WGSL).toContain(`fn ${name}(`)
    }
    // Integers such as 0 and 1 are written as 0.0 and 1.0.
    expect(COLOR_WGSL).not.toMatch(/[(,]\s*-?\d+\s*[,)]/)
  })
})
