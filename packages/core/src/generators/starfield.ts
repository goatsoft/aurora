import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * A night sky: three depths of stars that twinkle and wheel slowly around a pole above the canvas,
 * a faint milky way, and the odd shooting star. Stars are sized in pixels, so they stay pin-sharp at
 * any canvas size. Made to sit under an aurora.
 */
export const starfield = defineGenerator({
  id: 'starfield',
  label: 'Starfield',
  description: 'A night sky: twinkling stars, a faint milky way and the odd shooting star.',
  colors: 3,
  palette: ['oklch(0.12 0.03 268)', 'oklch(0.26 0.07 288)', 'oklch(0.97 0.02 245)'],
  requires: ['fbm', 'hash'],
  params: {
    density: { default: 0.65, min: 0, max: 1, step: 0.01, label: 'Density', description: 'How many stars there are.' },
    brightness: { default: 1, min: 0, max: 2, step: 0.01, label: 'Brightness', description: 'How bright the stars shine.' },
    twinkle: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Twinkle', description: 'How much the stars shimmer.' },
    milkyway: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Milky way', description: 'Strength of the band of faint stars and glow.' },
    meteors: { default: 0.35, min: 0, max: 1, step: 0.01, label: 'Meteors', description: 'How often a shooting star crosses the sky.' },
    speed: { default: 0.5, min: 0, max: 4, step: 0.01, label: 'Speed', description: 'How fast the sky turns.' },
    sky: { default: 1, min: 0, max: 1, step: 0.01, label: 'Sky', description: 'Opacity of the night-sky gradient behind the stars; 0 for stars alone.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different sky.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn ray(a: f32, b: f32, r: f32) -> f32 { return exp(-abs(a) * 2.2 - abs(b) / (r * 4.0)); }
fn stars(px: vec2f, cell: f32, chance: f32, size: f32, seed: f32, t: f32, P: Params) -> f32 {
  let base = floor(px / cell);
  var light = 0.0;
  for (var j = -1; j <= 1; j++) {
    for (var i = -1; i <= 1; i++) {
      let id = base + vec2f(f32(i), f32(j)) + seed;
      let h = noise_hash22(id);
      if (noise_hash21(id * 1.31 + 7.0) > chance) { continue; }
      let v = px - (id - seed + 0.5 + (h - 0.5) * 0.7) * cell;
      let d = length(v);
      let m = h.x * h.x;
      let r = size * (0.55 + 1.1 * m);
      let big = smoothstep(0.82, 1.0, m);
      let flicker = 1.0 - P.twinkle * 0.3 * (1.0 + sin(t * (1.3 + h.y * 2.6) + h.x * 40.0));
      light += (exp(-d * d / (r * r)) + (exp(-d / (r * 2.2)) * 0.22 + (ray(v.y, v.x, r) + ray(v.x, v.y, r)) * 0.45) * big) * (0.35 + 0.65 * m) * flicker;
    }
  }
  return light;
}
fn meteor(px: vec2f, res: vec2f, t: f32, P: Params) -> f32 {
  let w = floor(t / 3.0);
  let h = noise_hash22(vec2f(w, P.seed + 31.0));
  let life = (t - w * 3.0 - h.y * 2.1) / 0.9;
  if (h.x > P.meteors * 0.7 || life < 0.0 || life > 1.0) { return 0.0; }
  let r = noise_hash22(vec2f(w, P.seed + 57.0));
  let dir = normalize(vec2f(sign(r.x - 0.5) * (0.6 + 0.4 * r.y), 0.45 + 0.3 * r.x));
  let q = px - res * vec2f(0.1 + 0.8 * r.y, 0.05 + 0.3 * r.x) - dir * life * res.y * 0.55;
  let along = dot(q, -dir);
  let across = dot(q, vec2f(-dir.y, dir.x));
  return exp(-across * across / 1.1) * smoothstep(res.y * 0.16, 0.0, along) * step(-1.5, along) * smoothstep(0.0, 0.15, life) * smoothstep(1.0, 0.7, life);
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let t = ctx.time;
  let pole = vec2f(0.5, -0.8) * ctx.res;
  let a = t * P.speed * 0.004;
  let rot = mat2x2f(cos(a), sin(a), -sin(a), cos(a));
  let px = rot * (ctx.uv * ctx.res - pole) + pole;
  let n = ctx.uv * vec2f(ctx.res.x / ctx.res.y, 1.0) + P.seed * 1.7;
  let across = dot(n - vec2f(0.9, 0.5), vec2f(0.41, 0.91));
  let band = exp(-across * across * 9.0) * (0.55 + 0.9 * noise_fbm(rot * n * 2.2, 4)) * P.milkyway;
  let light = stars(px, 8.0, P.density * (0.3 + band * 1.4), 0.6, P.seed, t, P) * 0.7
    + stars(px, 24.0, P.density * 0.7, 0.8, P.seed + 13.0, t, P) * 0.9
    + stars(px, 64.0, P.density * 0.75, 1.05, P.seed + 29.0, t, P);
  let glow = max(band, 0.0) * 0.3;
  let s = clamp(light * P.brightness + meteor(px, ctx.res, t, P), 0.0, 1.0);
  let sky = mix(c[0], c[1], pow(smoothstep(0.1, 1.15, ctx.uv.y), 1.6));
  return vec4f(mix(sky + mix(c[1], c[2], 0.6) * glow, c[2], s), max(P.sky, clamp(s + glow, 0.0, 1.0)));
}
`,
  css: ({ colors, params, opacity }) => {
    const [night, horizon, star] = colors
    const sky = (color: typeof night) => formatOklch({ ...color!, alpha: params.sky * opacity })
    // A scatter of fixed stars: x%, y%, brightness.
    const dots = [[12, 18, 9], [37, 9, 7], [64, 27, 10], [23, 52, 5], [86, 40, 8]]
    return [
      ...dots.map(([x, y, b]) => `radial-gradient(1.5px 1.5px at ${x}% ${y}%, ${formatOklch({ ...star!, alpha: b! / 10 * opacity })}, transparent)`),
      `linear-gradient(in oklab to bottom, ${sky(night)}, ${sky(horizon)})`,
    ]
  },
})
