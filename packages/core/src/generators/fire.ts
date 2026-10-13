import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** Fire: turbulent flames rising from the bottom edge, with embers drifting up and flickering out. */
export const fire = defineGenerator({
  id: 'fire',
  label: 'Fire',
  description: 'Fire: flames rising from the bottom edge, with embers above them.',
  colors: 3,
  palette: ['oklch(0.42 0.18 27)', 'oklch(0.66 0.22 42)', 'oklch(0.92 0.15 88)'],
  requires: ['fbm', 'worley', 'hash'],
  params: {
    height: { default: 0.6, min: 0.1, max: 1.2, step: 0.01, label: 'Height', description: 'How far up the canvas the flames reach.' },
    speed: { default: 0.55, min: 0, max: 3, step: 0.01, label: 'Speed', description: 'How fast the flames rise.' },
    turbulence: { default: 0.65, min: 0, max: 1.5, step: 0.01, label: 'Turbulence', description: 'Higher makes the flames lick and flicker more.' },
    scale: { default: 2.2, min: 0.5, max: 6, step: 0.05, label: 'Scale', description: 'Higher gives smaller, more numerous flame tongues.' },
    embers: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Embers', description: 'How many sparks rise above the flames.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different fire.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn ramp(c: array<vec3f, 3>, k: f32) -> vec3f {
  return select(mix(c[1], c[2], k * 2.0 - 1.0), mix(c[0], c[1], k * 2.0), k < 0.5);
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let t = ctx.time * P.speed;
  let x = ctx.uv.x * aspect;
  let up = 1.0 - ctx.uv.y;
  // Flame columns: how high the fire reaches varies slowly along the bottom edge.
  let column = noise_fbm(vec2f(x * 0.8 * P.scale + P.seed, t * 0.12), 3) * 0.5 + 0.5;
  let reach = P.height * (0.45 + column);
  // Rising, vertically stretched turbulence, folded by a slower warp.
  let q = vec2f(x * P.scale * 1.5, up * P.scale - t * 1.5) + P.seed * 1.7;
  let warp = vec2f(noise_fbm(q * 0.45 + vec2f(0.0, t * 0.3), 3), noise_fbm(q * 0.45 + 3.7, 3)) * P.turbulence * 0.9;
  let n = noise_fbm(q + warp, 5) * 0.5 + 0.5;
  // Heat falls off with height, and the noise eats more of it towards the tips.
  let height = up / reach;
  let heat = clamp(1.0 - height + (n - 0.5) * P.turbulence * (0.5 + 1.8 * height), 0.0, 1.0);
  let flame = smoothstep(0.02, 0.3, heat);
  // Most of the fire is orange and red; it only turns white-hot deep in the base.
  var col = ramp(c, pow(heat, 1.7));
  // A faint ember-red glow above the flames, like light on smoke.
  let glow = exp(-height * 2.2) * 0.22 * (0.7 + 0.3 * n);
  var alpha = max(flame, glow);
  col = mix(c[0], col, flame / max(alpha, 1e-4));
  // Embers: sparse sparks that rise, sway and flicker out, only above the flames. They stay over a pixel wide.
  let lift = vec2f(x * 7.0 + sin(up * 6.0 + t) * 0.4, up * 7.0 - t * 2.2) + P.seed;
  let cell = noise_worley(lift).x;
  let life = noise_hash21(floor(lift) + floor(t * 1.5));
  let spark = (1.0 - smoothstep(0.015, max(0.05, 8.4 / ctx.res.y), cell)) * step(1.0 - P.embers * 0.35, life) * smoothstep(0.1, 0.5, height) * (1.0 - smoothstep(0.9, 1.8, height)) * (1.0 - flame);
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
