import { assertAurora } from '@goatsoft/aurora-format'
import type { AuroraInput } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { compose, shaderKey } from '../src/compose'

const doc = (layers: AuroraInput['layers'], extra: Partial<AuroraInput> = {}) =>
  assertAurora({ format: 'aurora', version: 1, name: 'T', palette: ['#4f8cff', '#a855f7', '#22d3ee'], layers, ...extra })

describe('compose', () => {
  it('namespaces generator code and declares its params struct', () => {
    const { code } = compose(doc([{ type: 'aurora-fbm' }]))
    expect(code).toContain('struct aurora_fbm_Params { intensity: f32, scale: f32, speed: f32, seed: f32, stretch: f32, sweep: f32 };')
    expect(code).toContain('fn aurora_fbm_fbm(p0: vec2f)')
    expect(code).toContain('aurora_fbm_render(ctx, aurora_fbm_Params(U.v[2].y, U.v[2].z, U.v[2].w, U.v[3].x, U.v[3].y, U.v[3].z)')
    expect(code).not.toMatch(/\bfn (hash|noise|fbm|render)\(/)
  })

  it('lays out uniforms: frame, then params, mask and colours per layer', () => {
    const shader = compose(doc([{ type: 'aurora-fbm' }, { type: 'aurora-fbm', mask: { type: 'radial' } }]))
    expect(shader.layers.map(({ params, mask, colors }) => ({ params, mask, colors }))).toEqual([
      { params: 2, mask: undefined, colors: 4 },
      { params: 7, mask: 9, colors: 10 },
    ])
    expect(shader.slots).toBe(13)
    expect(shader.code).toContain('array<vec4f, 13>')
  })

  it('emits each generator once however many layers use it', () => {
    const { code } = compose(doc([{ type: 'aurora-fbm' }, { type: 'aurora-fbm', blend: 'screen' }, { type: 'aurora-fbm', blend: 'add' }]))
    expect(code.match(/fn aurora_fbm_render/g)).toHaveLength(1)
    expect(code).toContain('acc = blend_normal(')
    expect(code).toContain('acc = blend_screen(')
    expect(code).toContain('acc = blend_add(')
  })

  it('converts colour to the output space per mix mode', () => {
    const srgb = compose(doc([{ type: 'aurora-fbm', mix: 'srgb' }]))
    expect(srgb.code).toContain('vec4f(s.rgb * a, a)')
    expect(compose(doc([{ type: 'aurora-fbm' }])).code).toContain('color_srgb_encode(color_oklab_to_linear_srgb(s.rgb))')
    expect(compose(doc([{ type: 'aurora-fbm' }]), 'display-p3').code).toContain('color_srgb_encode(color_oklab_to_linear_p3(s.rgb))')
    expect(compose(doc([{ type: 'aurora-fbm', mix: 'srgb' }]), 'display-p3').code)
      .toContain('color_srgb_encode(color_linear_srgb_to_linear_p3(color_srgb_decode(s.rgb)))')
  })

  it('applies masks and canvas fades', () => {
    const linear = compose(doc([{ type: 'aurora-fbm', mask: { type: 'linear' } }], { canvas: { fade: 'x' } })).code
    expect(linear).toContain('dot(suv - 0.5, U.v[4].xy)')
    expect(linear).toContain('acc *= smoothstep(0.0, 0.22, suv.x)')
    expect(compose(doc([{ type: 'aurora-fbm' }], { canvas: { fade: 'y' } })).code).toContain('smoothstep(0.0, 0.22, suv.y)')
    expect(compose(doc([{ type: 'aurora-fbm' }])).code).not.toContain('acc *=')
  })

  it('caches by shader key, ignoring values', () => {
    const a = doc([{ type: 'aurora-fbm', opacity: 0.2, params: { seed: 4 } }], { palette: ['#fff'] })
    const b = doc([{ type: 'aurora-fbm', opacity: 0.9 }])
    expect(shaderKey(a, 'srgb')).toBe(shaderKey(b, 'srgb'))
    expect(compose(a)).toBe(compose(b))
    expect(shaderKey(a, 'srgb')).not.toBe(shaderKey(a, 'display-p3'))
    expect(shaderKey(a, 'srgb')).toBe('srgb|none|aurora-fbm:normal:oklab:-')
  })

  it('refuses unknown generators', () => {
    expect(() => compose(doc([{ type: 'nebula' }]))).toThrow('Unknown generator "nebula". Validate documents with validateDocument() first.')
  })
})
