import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** A reusable CRT raster with a slow travelling exposure band. */
export const scanlines = defineGenerator({
  id: 'scanlines',
  label: 'Scan lines',
  description: 'Tech: a luminous CRT raster with soft scan lines and a slow rolling exposure band.',
  colors: 3,
  palette: ['oklch(0.12 0.03 285)', 'oklch(0.48 0.1 230)', 'oklch(0.8 0.12 195)'],
  params: {
    spacing: { default: 6, min: 2, max: 24, step: 1, label: 'Spacing', description: 'Distance between scan lines in canvas pixels.', unit: 'px' },
    softness: { default: 0.4, min: 0, max: 1, step: 0.01, label: 'Softness', description: 'Softness of the raster lines.' },
    strength: { default: 0.4, min: 0, max: 1, step: 0.01, label: 'Strength', description: 'Brightness of the raster lines.' },
    speed: { default: 0.045, min: 0, max: 0.2, step: 0.005, label: 'Drift', description: 'Speed of the travelling exposure band; 0 keeps it still.' },
    roll: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Roll', description: 'Brightness of the broad exposure band.' },
    phase: { default: 0.2, min: 0, max: 1, step: 0.01, label: 'Phase', description: 'Starting position of the exposure band.' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let spacing = max(P.spacing, 2.0);
  let phase = ctx.uv.y * ctx.res.y / spacing;
  // Analytic pixel integration damps the raster before it approaches Nyquist.
  let footprint = 3.14159265 / spacing;
  let attenuation = sin(footprint) / footprint * smoothstep(2.0, 4.0, spacing);
  let raster = 0.5 + 0.5 * cos(phase * 6.2831853) * attenuation * (1.0 - P.softness * 0.7);
  let d = abs(fract(ctx.uv.y - ctx.time * P.speed - P.phase + 0.5) - 0.5);
  let band = exp(-d * d / 0.008) * P.roll;
  let signal = mix(c[1], c[2], band);
  return vec4f(mix(c[0], signal, clamp(raster * P.strength + band * 0.35, 0.0, 1.0)), 1.0);
}
`,
  css: ({ colors, params, space, opacity }) => {
    const base = formatOklch({ ...colors[0]!, alpha: opacity })
    const line = formatOklch({ ...colors[1]!, alpha: opacity * params.strength })
    return [`repeating-linear-gradient(in ${space} 180deg, ${line} 0 1px, transparent ${params.spacing * 0.5}px ${params.spacing}px)`, `linear-gradient(${base}, ${base})`]
  },
})
