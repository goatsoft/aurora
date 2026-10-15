import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** A circular scanner with deterministic contacts that light up as the sweep passes them. */
export const radar = defineGenerator({
  id: 'radar',
  label: 'Radar',
  description: 'Tech: a rotating radar sweep, range rings and contacts fading into the dark.',
  colors: 3,
  palette: ['oklch(0.12 0.025 170)', 'oklch(0.76 0.15 165)', 'oklch(0.92 0.08 150)'],
  requires: ['hash'],
  params: {
    speed: { default: 0.08, min: 0, max: 0.5, step: 0.01, label: 'Speed', description: 'Clockwise rotations per second; 0 keeps the sweep still.', unit: '/s' },
    scale: { default: 0.85, min: 0.3, max: 1.5, step: 0.01, label: 'Scale', description: 'Diameter relative to the shorter canvas side.' },
    rings: { default: 5, min: 1, max: 12, step: 1, label: 'Range rings', description: 'Number of evenly spaced range rings.' },
    contacts: { default: 16, min: 0, max: 24, step: 1, label: 'Contacts', description: 'Number of illuminated returns.' },
    persistence: { default: 0.6, min: 0.05, max: 1, step: 0.01, label: 'Persistence', description: 'How long the sweep and contacts remain lit.' },
    grid: { default: 0.45, min: 0, max: 1, step: 0.01, label: 'Grid', description: 'Brightness of range rings and crosshairs.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'Different contact positions.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let size = min(ctx.res.x, ctx.res.y);
  let p = (ctx.uv - 0.5) * ctx.res / (size * P.scale * 0.5);
  let px = 2.0 / (size * P.scale);
  let r = length(p);
  let angle = atan2(p.y, p.x) / 6.2831853;
  let sweep = ctx.time * P.speed - 0.12;
  let age = fract(sweep - angle);
  let wedge = exp(-age * 7.0 / P.persistence) * 0.55;
  let rings = min(P.rings, 0.25 / px);
  let ring = abs(fract(r * rings + 0.5) - 0.5) / rings;
  let lines = 1.0 - smoothstep(px * 0.5, px * 1.5, min(ring, min(abs(p.x), abs(p.y))));
  var dots = 0.0;
  for (var i = 0; i < i32(P.contacts); i++) {
    let h = noise_hash22(vec2f(f32(i), P.seed * 31.0));
    let a = h.x * 6.2831853;
    let point = vec2f(cos(a), sin(a)) * sqrt(h.y) * 0.88;
    let d = length(p - point);
    let fade = (0.08 + 0.92 * exp(-fract(sweep - h.x) * 3.0 / P.persistence));
    let core = 1.0 - smoothstep(max(0.018, px), max(0.018, px) + px, d);
    dots += (core + exp(-d * d / 0.006) * 0.5) * fade;
  }
  let edge = 1.0 - smoothstep(1.0 - px, 1.0 + px, r);
  let ink = clamp((wedge + lines * P.grid * 0.65 + dots) * edge, 0.0, 1.0);
  return vec4f(mix(c[0], mix(c[1], c[2], clamp(dots, 0.0, 1.0)), ink), 1.0);
}
`,
  css: ({ colors, params, opacity }) => {
    const base = formatOklch({ ...colors[0]!, alpha: opacity })
    const ring = formatOklch({ ...colors[1]!, alpha: opacity * params.grid * 0.3 })
    const beam = formatOklch({ ...colors[1]!, alpha: opacity * 0.3 })
    return [`repeating-radial-gradient(circle, transparent 0 29px, ${ring} 30px 31px, transparent 32px 60px)`, `conic-gradient(from 200deg, transparent 0deg 260deg, ${beam} 315deg, transparent 316deg)`, `linear-gradient(${base}, ${base})`]
  },
})
