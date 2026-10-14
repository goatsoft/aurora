import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** A self-contained broken signal, rather than a post-process of earlier layers. */
export const glitch = defineGenerator({
  id: 'glitch',
  label: 'Glitch',
  description: 'Tech: fractured signal bands and separated colour accents, punctuated by short bursts.',
  colors: 3,
  palette: ['oklch(0.13 0.035 285)', 'oklch(0.75 0.14 195)', 'oklch(0.65 0.23 340)'],
  requires: ['hash'],
  params: {
    frequency: { default: 0.5, min: 0, max: 2, step: 0.01, label: 'Frequency', description: 'Burst windows per second; 0 freezes the signal.', unit: '/s' },
    strength: { default: 0.45, min: 0, max: 1, step: 0.01, label: 'Strength', description: 'Horizontal displacement during a burst.' },
    bands: { default: 32, min: 8, max: 80, step: 1, label: 'Bands', description: 'Number of horizontal signal bands.' },
    density: { default: 0.3, min: 0, max: 1, step: 0.01, label: 'Density', description: 'How much of the signal carries illuminated blocks.' },
    separation: { default: 0.4, min: 0, max: 1, step: 0.01, label: 'Separation', description: 'Distance between the two colour accents.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'Different signal fragments.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn signal(p: vec2f, bands: f32, density: f32, seed: f32, pixel: vec2f) -> f32 {
  let grid = p * vec2f(12.0, bands);
  let cell = floor(grid);
  let h = noise_hash22(cell + seed);
  let local = fract(grid);
  let edge = min(local, 1.0 - local);
  let inset = vec2f(0.025, 0.2);
  let coverage = smoothstep(inset, inset + pixel * vec2f(12.0, bands), edge);
  return coverage.x * coverage.y * step(1.0 - density * 0.5, h.x) * (0.25 + h.y * 0.75);
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let clock = ctx.time * P.frequency;
  let window = floor(clock);
  let phase = fract(clock);
  let burst = smoothstep(0.05, 0.08, phase) * (1.0 - smoothstep(0.2, 0.3, phase));
  let bands = min(P.bands, ctx.res.y / 3.0);
  let row = floor(ctx.uv.y * bands);
  let h = noise_hash22(vec2f(row + P.seed, window));
  let burstWeight = step(0.7, h.y) * burst;
  let offset = (h.x - 0.5) * P.strength * burstWeight;
  let p = ctx.uv + vec2f(offset, 0.0);
  let shift = vec2f(P.separation * (0.004 + burstWeight * 0.03), 0.0);
  let pixel = 1.0 / ctx.res;
  let a = signal(p - shift, bands, P.density, P.seed, pixel);
  let b = signal(p + shift, bands, P.density, P.seed, pixel);
  let ink = max(a, b) * (0.4 + burstWeight * 0.6);
  let accent = mix(c[1], c[2], b / max(a + b, 0.001));
  return vec4f(mix(c[0], accent, ink), 1.0);
}
`,
  css: ({ colors, space, opacity }) => {
    const base = formatOklch({ ...colors[0]!, alpha: opacity })
    const a = formatOklch({ ...colors[1]!, alpha: opacity * 0.15 })
    const b = formatOklch({ ...colors[2]!, alpha: opacity * 0.12 })
    return [`repeating-linear-gradient(in ${space} 0deg, transparent 0 29px, ${a} 30px 31px, transparent 32px 73px, ${b} 74px 77px)`, `linear-gradient(${base}, ${base})`]
  },
})
