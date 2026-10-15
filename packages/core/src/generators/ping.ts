import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** Expanding pulse rings with a soft halo and distance decay; no time-driven flashing. */
export const ping = defineGenerator({
  id: 'ping',
  label: 'Ping',
  description: 'Tech: luminous pulses expanding from a point and dissolving into a soft halo.',
  colors: 3,
  palette: ['oklch(0.14 0.04 265)', 'oklch(0.73 0.13 210)', 'oklch(0.88 0.09 185)'],
  params: {
    speed: { default: 0.12, min: 0, max: 0.6, step: 0.01, label: 'Speed', description: 'Outward pulse speed; 0 keeps the rings still.' },
    spacing: { default: 0.24, min: 0.08, max: 0.6, step: 0.01, label: 'Spacing', description: 'Distance between pulses, relative to the shorter canvas side.' },
    width: { default: 1.5, min: 0.5, max: 6, step: 0.1, label: 'Width', description: 'Pulse line width in canvas pixels.', unit: 'px' },
    decay: { default: 2.5, min: 0.5, max: 8, step: 0.1, label: 'Decay', description: 'How quickly pulses fade as they move outwards.' },
    glow: { default: 0.4, min: 0, max: 1, step: 0.01, label: 'Glow', description: 'Soft light surrounding each pulse.' },
    background: { default: 1, min: 0, max: 1, step: 0.01, label: 'Background', description: 'Base colour opacity; 0 leaves only the pulse, for interactive overlays.' },
    repeat: { default: 1, min: 0, max: 1, step: 1, label: 'Repeat', description: '1 repeats rings; 0 emits a single pulse from its origin.' },
    x: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Origin X', description: 'Horizontal pulse origin; 0 is left and 1 is right.' },
    y: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Origin Y', description: 'Vertical pulse origin; 0 is top and 1 is bottom.' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let size = min(ctx.res.x, ctx.res.y);
  let px = 1.0 / size;
  let r = length((ctx.uv - vec2f(P.x, P.y)) * ctx.res / size);
  let spacing = max(P.spacing, px * 4.0);
  let travel = ctx.time * P.speed + spacing * 0.4 * P.repeat;
  let d = mix(abs(r - travel), abs(fract((r - travel) / spacing + 0.5) - 0.5) * spacing, P.repeat);
  let width = max(P.width * 0.5, 0.5) * px;
  let core = 1.0 - smoothstep(width, width + px, d);
  let halo = exp(-d / max(px * 3.0, spacing * 0.09)) * P.glow * 0.4;
  let decay = exp(-r * P.decay) * smoothstep(0.0, spacing * 0.25, r);
  let intensity = clamp((core + halo) * decay, 0.0, 1.0);
  let ring = mix(c[1], c[2], core * 0.6);
  return vec4f(mix(ring, mix(c[0], ring, intensity), P.background), mix(intensity, 1.0, P.background));
}
`,
  css: ({ colors, params, opacity }) => {
    const base = formatOklch({ ...colors[0]!, alpha: opacity * params.background })
    const ring = formatOklch({ ...colors[1]!, alpha: opacity * 0.25 })
    const step = params.spacing * 100
    const shape = params.repeat >= 0.5 ? 'repeating-radial-gradient' : 'radial-gradient'
    return [`${shape}(circle at ${params.x * 100}% ${params.y * 100}%, transparent 0 ${step * 0.8}%, ${ring} ${step * 0.85}%, transparent ${step}%)`, `linear-gradient(${base}, ${base})`]
  },
})
