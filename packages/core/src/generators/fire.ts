import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** Fire: turbulent flames rising from the bottom edge, with embers drifting up and flickering out. */
export const fire = defineGenerator({
  id: 'fire',
  label: 'Fire',
  description: 'Fire: flames licking up from the bottom edge, with rising embers.',
  colors: 3,
  palette: ['oklch(0.45 0.19 28)', 'oklch(0.68 0.21 45)', 'oklch(0.94 0.12 92)'],
  requires: ['fbm', 'worley', 'hash'],
  params: {
    height: { default: 0.6, min: 0.1, max: 1.2, step: 0.01, label: 'Height', description: 'How far up the canvas the flames reach.' },
    speed: { default: 0.55, min: 0, max: 3, step: 0.01, label: 'Speed', description: 'How fast the flames rise.' },
    turbulence: { default: 0.65, min: 0, max: 1.5, step: 0.01, label: 'Turbulence', description: 'How wildly the flames lick.' },
    scale: { default: 2.2, min: 0.5, max: 6, step: 0.05, label: 'Scale', description: 'Size of the flame tongues.' },
    embers: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Embers', description: 'How many sparks rise above the flames.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different fire.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let t = ctx.time * P.speed;
  let up = 1.0 - ctx.uv.y;
  let p = vec2f(ctx.uv.x * aspect * P.scale, up * P.scale * 0.8 - t) + P.seed * 1.9;
  let warp = vec2f(noise_fbm(p * 0.7 + vec2f(0.0, -t * 0.4), 3), 0.0) * P.turbulence;
  let n = noise_turbulence(p + warp, 5);
  var heat = clamp((1.0 - up / P.height) * 1.15 + (n - 0.35) * P.turbulence * 1.4, 0.0, 1.0);
  heat = heat * heat * (3.0 - 2.0 * heat);
  var col = select(mix(c[1], c[2], heat * 2.0 - 1.0), mix(c[0], c[1], heat * 2.0), heat < 0.5);
  var alpha = smoothstep(0.02, 0.35, heat);
  // Embers: one spark per cell, rising and flickering.
  let cells = vec2f(ctx.uv.x * aspect, up) * 9.0 - vec2f(0.0, t * 1.6) + P.seed;
  let cell = noise_worley(cells).x;
  let flicker = noise_hash21(floor(cells) + floor(t * 6.0)) ;
  let spark = (1.0 - smoothstep(0.02, 0.07, cell)) * step(1.0 - P.embers * 0.6, flicker) * smoothstep(1.0, 0.2, up);
  col = mix(col, c[2], spark);
  alpha = max(alpha, spark);
  return vec4f(col, alpha);
}
`,
  css: ({ colors, opacity }) => {
    const [ember, flame, core] = colors.map((color, i) => formatOklch({ ...color, alpha: [0.6, 0.75, 0.9][i]! * opacity }))
    return [
      `radial-gradient(60% 35% at 50% 100% in oklab, ${core!}, transparent 70%)`,
      `radial-gradient(90% 60% at 50% 100% in oklab, ${flame!}, transparent 75%)`,
      `linear-gradient(in oklab to top, ${ember!}, transparent 65%)`,
    ]
  },
})
