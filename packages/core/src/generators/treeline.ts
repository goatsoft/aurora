import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * A treeline: rows of spruce silhouettes standing on dark ground, for the bottom of a night sky.
 * Each tree is a cone that comes to a sharp point, with tiers of branches; heights and spacing vary by a hash. Farther
 * rows are shorter, denser and lean towards the second colour, and `mist` lays a soft band of the
 * third colour along the horizon behind them, like sky glow. Above the trees the layer is
 * transparent.
 */
export const treeline = defineGenerator({
  id: 'treeline',
  label: 'Treeline',
  description: 'Earth: rows of spruce silhouettes along the horizon, with glow behind them.',
  colors: 3,
  palette: ['oklch(0.06 0.01 250)', 'oklch(0.13 0.03 245)', 'oklch(0.45 0.1 165)'],
  requires: ['fbm', 'hash'],
  params: {
    height: { default: 0.24, min: 0.05, max: 0.6, step: 0.01, label: 'Height', description: 'How tall the nearest trees stand, as a fraction of the canvas.' },
    density: { default: 10, min: 2, max: 40, step: 0.5, label: 'Density', description: 'Trees across one canvas height.' },
    rows: { default: 2, min: 1, max: 3, step: 1, label: 'Rows', description: 'Rows of trees, one behind another.' },
    variation: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Variation', description: 'How much the trees differ in height.' },
    mist: { default: 0.3, min: 0, max: 1, step: 0.01, label: 'Glow', description: 'Light along the horizon behind the trees.' },
    speed: { default: 0, min: 0, max: 2, step: 0.01, label: 'Drift', description: 'How fast the rows slide past (near ones faster).' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different forest.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn spruce(x: f32, y: f32, base: f32, h: f32, n: f32, k: f32, px: f32, P: Params) -> f32 {
  let cell = floor(x * n);
  var a = 0.0;
  for (var j = -1; j <= 1; j++) {
    let c = cell + f32(j);
    let r = noise_hash22(vec2f(c, k * 7.0 + P.seed));
    let cx = (c + 0.5 + (r.x - 0.5) * 0.8) / n;
    let th = h * (1.0 - P.variation * 0.7 * r.y);
    let top = base - th;
    let rel = clamp((y - top) / th, 0.0, 1.0);
    let tier = fract(rel * (5.0 + 4.0 * r.y));
    let hw = th * rel * (0.1 + 0.1 * tier);
    a = max(a, smoothstep(hw + px, hw - px, abs(x - cx)) * smoothstep(top - px, top, y));
  }
  return a;
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let px = 1.0 / ctx.res.y;
  let y = ctx.uv.y;
  let rows = i32(P.rows);
  let horizon = 1.0 - P.height * 0.75;
  var col = c[2];
  var alpha = P.mist * 0.8 * exp(-abs(y - horizon) / (P.height * 0.6)) * smoothstep(0.0, 0.5, y);
  for (var i = 0; i < 3; i++) {
    if (i >= rows) { break; }
    let k = select(f32(i) / (f32(rows) - 1.0), 1.0, rows == 1);
    let far = 1.0 - k;
    let h = P.height * (0.5 + 0.5 * k);
    let x = ctx.uv.x * aspect + ctx.time * P.speed * 0.01 * (0.3 + k) + f32(i) * 1.7;
    let base = 1.0 - P.height * (0.1 + 0.2 * far) + 0.012 * noise_fbm(vec2f(x * 1.5, f32(i) + P.seed), 2);
    let a = max(spruce(x, y, base, h, P.density * (1.0 + far), f32(i), px, P), smoothstep(base - px, base + px, y));
    col = mix(col, mix(c[0], c[1], far * 0.85), a);
    alpha = max(alpha, a);
  }
  return vec4f(col, alpha);
}
`,
  // A dark band where the trees stand.
  css: ({ colors, params, opacity }) => {
    const [near, far] = colors.map((color) => formatOklch({ ...color, alpha: opacity }))
    const h = Math.round(params.height * 100)
    return [`linear-gradient(in oklab to top, ${near!} 0 ${Math.round(h * 0.3)}%, ${far!} ${Math.round(h * 0.6)}%, transparent ${h}%)`]
  },
})
