import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** A softly illuminated phosphor lattice with broad, drifting luminance. */
export const phosphor = defineGenerator({
  id: 'phosphor',
  label: 'Phosphor',
  description: 'Tech: a glowing display-dot lattice with a soft, drifting phosphor bloom.',
  colors: 3,
  palette: ['oklch(0.13 0.035 285)', 'oklch(0.65 0.15 200)', 'oklch(0.65 0.2 335)'],
  params: {
    spacing: { default: 8, min: 2, max: 24, step: 1, label: 'Spacing', description: 'Distance between phosphor dots in canvas pixels.', unit: 'px' },
    glow: { default: 0.45, min: 0, max: 1, step: 0.01, label: 'Glow', description: 'Soft light around each display dot.' },
    strength: { default: 0.4, min: 0, max: 1, step: 0.01, label: 'Strength', description: 'Brightness of the phosphor texture.' },
    speed: { default: 0.08, min: 0, max: 0.3, step: 0.01, label: 'Speed', description: 'Drift of the broad illumination; 0 keeps it still.' },
    phase: { default: 0, min: 0, max: 1, step: 0.01, label: 'Phase', description: 'Starting position of the illumination.' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let spacing = max(P.spacing, 2.0);
  let cell = ctx.uv * ctx.res / spacing;
  // Fade periodic detail at small pixel footprints instead of producing moire.
  let attenuation = smoothstep(2.0, 6.0, spacing);
  let lattice = (0.5 + 0.5 * cos(cell.x * 6.2831853) * attenuation) * (0.5 + 0.5 * cos(cell.y * 6.2831853) * attenuation);
  let light = 0.5 + 0.5 * sin((ctx.uv.x * 0.7 + ctx.uv.y * 0.3 - ctx.time * P.speed + P.phase) * 6.2831853);
  let dots = mix(lattice * lattice, lattice, P.glow);
  return vec4f(mix(c[0], mix(c[1], c[2], light), dots * P.strength * (0.4 + light * 0.6)), 1.0);
}
`,
  css: ({ colors, params, opacity }) => {
    const base = formatOklch({ ...colors[0]!, alpha: opacity })
    const light = formatOklch({ ...colors[1]!, alpha: opacity * params.strength * 0.2 })
    return [`radial-gradient(ellipse at 35% 45%, ${light}, transparent 70%)`, `linear-gradient(${base}, ${base})`]
  },
})
