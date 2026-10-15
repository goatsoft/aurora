import type { AuroraInput } from '@goatsoft/aurora-format'
import { assertAurora } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { compileCss, DRIFT_KEYFRAMES } from '@/css'
import { loadGenerators, registerGenerator } from '@/generators/index'
import { solid } from './solid'

const doc = (extra: Partial<AuroraInput>) =>
  assertAurora({ format: 'aurora', version: 1, name: 'T', palette: ['oklch(0.68 0.16 245)', 'oklch(0.56 0.22 285)', 'oklch(0.58 0.25 310)'], layers: [{ type: 'aurora-fbm' }], ...extra })

describe('compileCss', () => {
  it('paints one fallback ring for a single-pulse Ping, preserving repeating defaults', async () => {
    await loadGenerators(['ping'])
    const single = compileCss(doc({ layers: [{ type: 'ping', params: { repeat: 0, background: 0 } }] }))
    expect(single.backgroundImage).toMatch(/^radial-gradient\(/)
    expect(single.backgroundImage).not.toContain('repeating-')
    const repeating = compileCss(doc({ layers: [{ type: 'ping' }] }))
    expect(repeating.backgroundImage).toMatch(/^repeating-radial-gradient\(/)
  })

  it('compiles aurora-fbm to three OKLab clouds at 0.28 × intensity', () => {
    const css = compileCss(doc({ layers: [{ type: 'aurora-fbm', params: { intensity: 0.5 } }] }))
    expect(css.backgroundImage).toBe([
      'radial-gradient(60% 40% at 20% 30% in oklab, oklch(0.68 0.16 245 / 0.14), transparent 70%)',
      'radial-gradient(50% 45% at 75% 60% in oklab, oklch(0.56 0.22 285 / 0.14), transparent 70%)',
      'radial-gradient(70% 35% at 50% 90% in oklab, oklch(0.58 0.25 310 / 0.14), transparent 70%)',
    ].join(', '))
    expect(css.backgroundBlendMode).toBe('normal, normal, normal')
    expect(css.maskImage).toBeUndefined()
    expect(css.drift).toBe(40)
  })

  it('gamut-maps colours, folds in opacity, and interpolates in the layer\'s mix space', () => {
    const css = compileCss(doc({ palette: ['oklch(0.7 0.4 145)'], layers: [{ type: 'aurora-fbm', opacity: 0.5, mix: 'srgb' }] }))
    expect(css.backgroundImage).toMatch(/^radial-gradient\(60% 40% at 20% 30% in srgb, oklch\(0\.7\d* 0\.2\d* 14\d(\.\d+)? \/ 0\.14\)/)
  })

  it('stacks layers top first with their blend modes', () => {
    registerGenerator(solid)
    const css = compileCss(doc({ layers: [{ type: 'aurora-fbm' }, { type: 'test-solid', blend: 'add' }, { type: 'test-solid', blend: 'multiply' }] }))
    expect(css.backgroundBlendMode).toBe('multiply, screen, normal, normal, normal')
    expect(css.backgroundImage.startsWith('linear-gradient(1deg, red, red), linear-gradient(1deg, red, red), radial-gradient(')).toBe(true)
  })

  it('skips unknown generators and still produces valid CSS', () => {
    expect(compileCss(doc({ layers: [{ type: 'nebula' }] }))).toMatchObject({ backgroundImage: 'none', backgroundBlendMode: 'normal' })
  })

  it('uses hand-tuned layers and fades the canvas with a mask', () => {
    const css = compileCss(doc({ canvas: { fade: 'y' }, motion: { speed: 0.5 }, fallback: { mode: 'css', layers: ['linear-gradient(red, blue)', 'radial-gradient(white, transparent)'] } }))
    expect(css).toEqual({
      backgroundImage: 'linear-gradient(red, blue), radial-gradient(white, transparent)',
      backgroundBlendMode: 'normal, normal',
      maskImage: 'linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)',
      drift: 80,
      style: 'background-image:linear-gradient(red, blue), radial-gradient(white, transparent);background-blend-mode:normal, normal;'
        + 'mask-image:linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent);-webkit-mask-image:linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)',
    })
    expect(compileCss(doc({ canvas: { fade: 'x' } })).maskImage).toContain('to right')
  })

  it('stays still when motion speed is 0', () => {
    expect(compileCss(doc({ motion: { speed: 0 } })).drift).toBe(0)
  })

  it('drifts with transform only', () => {
    expect(DRIFT_KEYFRAMES).toMatch(/^@keyframes aurora-drift\{/)
    expect(DRIFT_KEYFRAMES).not.toMatch(/filter|blur|background/)
  })

  it('throws on colours the format would reject', () => {
    const bad = { ...doc({}), palette: ['nope'] }
    expect(() => compileCss(bad)).toThrow('"nope" is not a colour.')
  })
})
