import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** Wind: streaks stretched along a direction and bent by gusts of curl noise, with transparent air between. */
export const wind = defineGenerator({
  id: 'wind',
  label: 'Wind',
  description: 'Wind: soft streaks flowing across the canvas, bent by gusts.',
  colors: 3,
  palette: ['oklch(0.86 0.05 225)', 'oklch(0.68 0.1 240)', 'oklch(0.97 0.02 210)'],
  requires: ['curl', 'simplex'],
  params: {
    angle: { default: 75, min: 0, max: 360, step: 1, label: 'Angle', description: 'Direction the wind blows, CSS convention (90 = left to right).', unit: 'deg' },
    speed: { default: 0.22, min: 0, max: 2, step: 0.01, label: 'Speed', description: 'How fast the streaks travel.' },
    stretch: { default: 7, min: 1, max: 20, step: 0.1, label: 'Stretch', description: 'How long the streaks are.' },
    gust: { default: 0.55, min: 0, max: 2, step: 0.01, label: 'Gust', description: 'How much the flow bends.' },
    density: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Density', description: 'How much of the sky the streaks fill.' },
    scale: { default: 2.5, min: 0.5, max: 8, step: 0.05, label: 'Scale', description: 'Size of the streaks.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different sky.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let a = radians(P.angle);
  let dir = vec2f(sin(a), -cos(a));
  let p0 = vec2f(ctx.uv.x * aspect, ctx.uv.y) * P.scale + P.seed * 2.3;
  // Gusts: bend the coordinates along a slowly moving curl field.
  let p = p0 + noise_curl(p0 * 0.3 + vec2f(ctx.time * 0.04, 0.0)) * P.gust * 0.03;
  // Streak space: long along the wind, short across it, travelling downwind.
  let along = dot(p, dir) - ctx.time * P.speed * P.scale;
  let across = dot(p, vec2f(-dir.y, dir.x));
  let q = vec2f(along / P.stretch, across);
  let s = noise_simplex(q * 1.7) * 0.6 + noise_simplex(q * 3.9 + 11.0) * 0.4;
  let streak = smoothstep(1.0 - P.density, 1.0, s * 0.5 + 0.5);
  let tint = noise_simplex(p * 0.3 + 4.0) * 0.5 + 0.5;
  let col = mix(mix(c[1], c[0], tint), c[2], streak * streak);
  return vec4f(col, streak);
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
