import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Air: low-lying banks of fog and mist drifting horizontally across the canvas, for valleys,
 * shorelines and city skylines. Two depths of billowy fbm gather in a horizontal band around
 * `altitude`, with `spread` setting how thick the bank is and `billow` curling the upper crest into
 * rising wisps. Outside the banks the layer is transparent, so it weaves between or over mountains,
 * trees, towers and water.
 */
export const fog = defineGenerator({
  id: 'fog',
  label: 'Fog',
  description: 'Air: drifting banks of low-lying fog and mist that weave across the horizon.',
  colors: 2,
  palette: ['oklch(0.32 0.04 245)', 'oklch(0.78 0.04 225)'],
  requires: ['fbm'],
  params: {
    density: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Density', description: 'How thick the fog is.' },
    altitude: { default: 0.72, min: 0, max: 1, step: 0.01, label: 'Altitude', description: 'Where the fog bank sits vertically (0 = top, 1 = bottom).' },
    spread: { default: 0.32, min: 0.08, max: 0.8, step: 0.01, label: 'Spread', description: 'Vertical thickness of the fog bank.' },
    billow: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Billow', description: 'How much the fog curls into rising wisps instead of a flat sheet.' },
    speed: { default: 0.3, min: 0, max: 2, step: 0.01, label: 'Speed', description: 'How fast the fog drifts.' },
    angle: { default: 90, min: 0, max: 360, step: 1, label: 'Angle', description: 'Direction the fog drifts, CSS convention (90 = left to right).', unit: 'deg' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different bank of fog.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn bank(p: vec2f, y: f32, alt: f32, spread: f32, billow: f32) -> vec2f {
  let warp = noise_fbm(p * vec2f(0.45, 1.1) + 4.3, 2) * billow * spread * 0.45;
  let dy = (y - alt + warp) / max(spread, 0.04);
  let env = exp(-dy * dy * 2.4);
  let detail = noise_fbm(p * vec2f(0.9, 2.2) + vec2f(warp * 2.0, 0.0), 3) * 0.5 + 0.5;
  let wisp = mix(1.0, smoothstep(0.22, 0.82, detail), 0.35 + 0.55 * billow);
  let lit = clamp(0.5 - dy * 0.45 + (detail - 0.5) * 0.4, 0.0, 1.0);
  return vec2f(env * wisp, lit);
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 2>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let a = radians(P.angle);
  let dir = vec2f(sin(a), -cos(a) * 0.25);
  let t = ctx.time * P.speed * 0.08;
  let q = vec2f(ctx.uv.x * aspect, ctx.uv.y) + P.seed * 3.7;
  let far = bank(q * 2.1 - dir * t * 0.6 + 7.1, ctx.uv.y, P.altitude - P.spread * 0.14, P.spread * 0.85, P.billow);
  let near = bank(q * 1.35 - dir * t * 1.1 + 19.3, ctx.uv.y, P.altitude + P.spread * 0.08, P.spread, P.billow);
  let w0 = far.x * P.density * 0.65;
  let w1 = near.x * P.density * 0.85;
  let alpha = clamp(w0 + w1 * (1.0 - w0), 0.0, 1.0);
  let lit = select(0.5, (far.y * w0 * 0.75 + near.y * w1) / max(w0 + w1, 1e-4), alpha > 1e-4);
  return vec4f(mix(c[0], c[1], clamp(lit, 0.0, 1.0)), alpha);
}
`,
  css: ({ colors, params, opacity }) => {
    const [deep, mist] = colors
    const y = Math.round(params.altitude * 100)
    const span = Math.round(params.spread * 75)
    const top = Math.max(0, y - span)
    const bot = Math.min(100, y + span)
    const a = params.density * opacity
    return [
      `linear-gradient(in oklab to bottom, transparent ${top}%, ${formatOklch({ ...mist!, alpha: a * 0.55 })} ${Math.round((top + y) * 0.5)}%, ${formatOklch({ ...deep!, alpha: a * 0.75 })} ${y}%, transparent ${bot}%)`,
    ]
  },
})
