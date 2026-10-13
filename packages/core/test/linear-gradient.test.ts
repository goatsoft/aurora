import { assertAurora } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { compileCss } from '@/css'
import { loadGenerators } from '@/generators/index'

await loadGenerators(['linear-gradient'])

const palette = ['oklch(0.2 0.05 275)', 'oklch(0.4 0.1 295)', 'oklch(0.6 0.15 330)', 'oklch(0.8 0.12 60)']
const css = (params: Record<string, number>) =>
  compileCss(assertAurora({ format: 'aurora', version: 1, name: 'T', palette, layers: [{ type: 'linear-gradient', params }] })).backgroundImage

describe('linear-gradient', () => {
  it('falls back to the same CSS gradient: angle, stops in palette order, inner stop positions', () => {
    expect(css({})).toBe('linear-gradient(in oklab 180deg, oklch(0.2 0.05 275) 0%, oklch(0.4 0.1 295) 50%, oklch(0.6 0.15 330) 100%)')
    expect(css({ angle: 90, stops: 2 })).toBe('linear-gradient(in oklab 90deg, oklch(0.2 0.05 275) 0%, oklch(0.4 0.1 295) 100%)')
    expect(css({ stops: 4, stop2: 0.2, stop3: 0.6 })).toBe('linear-gradient(in oklab 180deg, oklch(0.2 0.05 275) 0%, oklch(0.4 0.1 295) 20%, oklch(0.6 0.15 330) 60%, oklch(0.8 0.12 60) 100%)')
  })

  it('keeps the stops in order, as the shader does', () => {
    expect(css({ stops: 4, stop2: 0.7, stop3: 0.3 })).toContain('oklch(0.4 0.1 295) 70%, oklch(0.6 0.15 330) 70%')
  })
})
