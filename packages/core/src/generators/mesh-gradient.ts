import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * A living mesh gradient: four colour points drift on slow Lissajous paths and blend by inverse
 * distance in OKLab, with a gentle simplex warp so edges never look geometric.
 */
export const meshGradient = defineGenerator({
  id: 'mesh-gradient',
  label: 'Mesh gradient',
  description: 'Four soft colour fields drifting into each other.',
  colors: 4,
  palette: ['oklch(0.6 0.2 262)', 'oklch(0.52 0.25 300)', 'oklch(0.74 0.15 198)', 'oklch(0.62 0.23 350)'],
  requires: ['simplex'],
  params: {
    speed: { default: 0.12, min: 0, max: 1, step: 0.01, label: 'Speed', description: 'How fast the colour points drift.' },
    softness: { default: 2.4, min: 1, max: 6, step: 0.05, label: 'Softness', description: 'Higher keeps each colour in its own area; lower blends them broadly.' },
    warp: { default: 0.18, min: 0, max: 1, step: 0.01, label: 'Warp', description: 'Organic distortion of the blend.' },
    spread: { default: 0.36, min: 0.05, max: 0.6, step: 0.01, label: 'Spread', description: 'How far the colour points travel from the centre.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'Changes the paths.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 4>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let t = ctx.time * P.speed + P.seed * 1.7;
  var uv = ctx.uv;
  uv += P.warp * 0.25 * vec2f(noise_simplex(uv * 2.0 + vec2f(t * 0.3, 0.0)), noise_simplex(uv * 2.0 + vec2f(7.1, t * 0.3)));
  let q = vec2f(uv.x * aspect, uv.y);
  var acc = vec3f(0.0);
  var total = 0.0;
  for (var i = 0; i < 4; i++) {
    let k = f32(i);
    let o = vec2f(sin(t * (0.61 + 0.13 * k) + k * 2.4), cos(t * (0.47 + 0.11 * k) + k * 1.7));
    let point = vec2f((0.5 + o.x * P.spread) * aspect, 0.5 + o.y * P.spread);
    let w = 1.0 / pow(distance(q, point) + 0.02, P.softness);
    acc += c[i] * w;
    total += w;
  }
  return vec4f(acc / total, 1.0);
}
`,
  css: ({ colors, opacity }) => {
    const [a, b, c, d] = colors.map((color) => formatOklch({ ...color, alpha: opacity }))
    return [
      `radial-gradient(60% 60% at 15% 20% in oklab, ${a!}, transparent)`,
      `radial-gradient(55% 55% at 85% 25% in oklab, ${b!}, transparent)`,
      `radial-gradient(60% 60% at 75% 85% in oklab, ${c!}, transparent)`,
      `linear-gradient(in oklab 160deg, ${d!}, ${a!})`,
    ]
  },
})
