import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** Wind: streaks stretched along a direction and bent by gusts of curl noise, with transparent air between. */
export const wind = defineGenerator({
  id: 'wind',
  label: 'Wind',
  description: 'Air in motion: thin streaks that flow across the canvas and bend in gusts.',
  colors: 3,
  palette: ['oklch(0.86 0.05 225)', 'oklch(0.68 0.1 240)', 'oklch(0.97 0.02 210)'],
  requires: ['curl', 'simplex'],
  params: {
    angle: { default: 75, min: 0, max: 360, step: 1, label: 'Angle', description: 'Direction the wind blows, CSS convention (90 = left to right).', unit: 'deg' },
    speed: { default: 0.22, min: 0, max: 2, step: 0.01, label: 'Speed', description: 'How fast the streaks travel.' },
    stretch: { default: 6, min: 1, max: 20, step: 0.1, label: 'Stretch', description: 'Higher gives longer streaks.' },
    gust: { default: 0.55, min: 0, max: 2, step: 0.01, label: 'Gust', description: 'How much the flow bends.' },
    density: { default: 0.45, min: 0, max: 1, step: 0.01, label: 'Density', description: 'How much of the sky the streaks fill.' },
    scale: { default: 2.5, min: 0.5, max: 8, step: 0.05, label: 'Scale', description: 'Higher gives smaller, finer streaks.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different sky.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn wisps(p: vec2f, dir: vec2f, t: f32, stretch: f32) -> f32 {
  let along = dot(p, dir) - t;
  let across = dot(p, vec2f(-dir.y, dir.x));
  let q = vec2f(along / stretch, across);
  // Ridged filaments: silk, not blobs.
  let f = pow(1.0 - abs(noise_simplex(q * vec2f(1.0, 2.2))), 7.0) * 0.7 + pow(1.0 - abs(noise_simplex(q * vec2f(1.6, 3.6) + 9.0)), 9.0) * 0.5;
  // Gusts: broad regions where the wind shows and hides.
  let gust = smoothstep(0.35, 0.95, noise_simplex(vec2f(along / (stretch * 2.5), across * 0.3) + 4.0) * 0.5 + 0.5);
  return f * gust;
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let a = radians(P.angle);
  let dir = vec2f(sin(a), -cos(a));
  let base = vec2f(ctx.uv.x * aspect, ctx.uv.y) * P.scale + P.seed * 2.3;
  let bend = noise_curl(base * 0.25 + vec2f(ctx.time * 0.03, 0.0)) * P.gust * 0.03;
  var col = c[1];
  var alpha = 0.0;
  // Three depths: far wisps are smaller, slower and fainter (parallax).
  for (var i = 0; i < 3; i++) {
    let k = f32(i);
    let depth = 1.0 - k * 0.3;
    let s = wisps((base + bend * depth) * (1.0 + k * 0.7) + k * 13.0, dir, ctx.time * P.speed * P.scale * depth * (1.0 + k * 0.7), P.stretch);
    let w = clamp(s * P.density * 2.0, 0.0, 1.0) * depth;
    col = mix(col, mix(c[0], c[2], s), w / max(alpha + w, 1e-4));
    alpha = alpha + w * (1.0 - alpha);
  }
  return vec4f(col, alpha);
}
`,
  css: ({ colors, params, opacity }) => {
    const [a, b, c] = colors.map((color) => formatOklch({ ...color, alpha: 0.35 * opacity }))
    return [
      `repeating-linear-gradient(in oklab ${params.angle + 90}deg, transparent 0 18%, ${c!} 24%, transparent 32%)`,
      `linear-gradient(in oklab ${params.angle}deg, ${b!}, ${a!}, transparent)`,
    ]
  },
})
