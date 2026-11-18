import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * City: realistic multi-layered cityscape built on 1D domain repetition and composite 2D box SDFs.
 * Proportions are calibrated against real skyline photographs: broad, stocky mid-rise and high-rise
 * slabs (`W/H` 0.25–0.45) overlap into a dense urban wall, punctuated by 1–2 central supertall
 * landmark towers with stepped setbacks, spires and fourth-power pulsing aviation beacons. Inside
 * each silhouette, buildings switch between discrete office window grids, horizontal curtain-wall
 * floor bands and vertical glass strips, with bright rooftop crown bands, directional SDF rim
 * lighting and Beer-Lambert atmospheric attenuation (`1 - exp(-sigma * dz)`).
 */
export const skyline = defineGenerator({
  id: 'skyline',
  label: 'Skyline',
  description: 'City: layered towers with lit window grids, spires and glass.',
  colors: 4,
  palette: ['oklch(0.08 0.025 250)', 'oklch(0.32 0.065 232)', 'oklch(0.92 0.08 85)', 'oklch(0.75 0.11 218)'],
  requires: ['hash'],
  params: {
    rows: { default: 5, min: 1, max: 5, step: 1, label: 'Rows', description: 'Rows of towers.' },
    density: { default: 6, min: 2.5, max: 14, step: 0.5, label: 'Density', description: 'Blocks per height.' },
    height: { default: 0.54, min: 0.15, max: 0.85, step: 0.01, label: 'Height', description: 'Max tower height.' },
    spires: { default: 0.55, min: 0, max: 1, step: 0.01, label: 'Spires', description: 'Crowns and spires.' },
    windows: { default: 0.82, min: 0, max: 1, step: 0.01, label: 'Windows', description: 'Window brightness.' },
    rim: { default: 0.45, min: 0, max: 1, step: 0.01, label: 'Rim light', description: 'Edge light.' },
    haze: { default: 0.65, min: 0, max: 1, step: 0.01, label: 'Haze', description: 'Distance haze.' },
    speed: { default: 0, min: 0, max: 2, step: 0.01, label: 'Drift', description: 'Parallax drift.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'Random seed.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn bx(x: f32, y: f32, w: f32, h: f32) -> f32 { return max(abs(x) - w, y - h); }
fn render(ctx: Ctx, P: Params, c: array<vec3f, 4>) -> vec4f {
let a = ctx.res.x / ctx.res.y;
let px = 1.0 / ctx.res.y;
let uv = vec2f((ctx.uv.x - 0.5) * a, 1.0 - ctx.uv.y);
let tall = P.height * min(1.0, a);
let n = P.rows * 2.0 - 1.0;
var col = c[1] * (1.2 - uv.y / tall * 0.6);
var alpha = P.haze * 0.85 * exp(-max(0.0, uv.y - tall * 0.48) / (tall * 0.42)) * smoothstep(0.95, 0.25, uv.y);
for (var k = 0; k < 9; k++) {
let fi = n - 1.0 - f32(k);
if (fi < 0.0) { break; }
let df = fi / max(1.0, n - 1.0);
let f = P.density * (0.8 + df * 1.45);
let u = uv.x + (ctx.time * P.speed * 0.08 / (1.0 + fi * 0.35)) % 64.0;
let xs = u * f + fi * 1.7 + P.seed * 3.1;
let id = floor(xs);
let xl = fract(xs) - 0.5;
let ly = max(0.0, uv.y - df * tall * 0.38);
let h = noise_hash22(vec2f(id, fi * 17.3 + P.seed));
let r = noise_hash22(vec2f(id + 29.1, fi + P.seed));
let cx = u - xl / f;
let h1 = tall * mix(0.28 + 0.34 * h.x, 0.72 + 0.28 * r.x, step(0.8, h.x)) * (0.55 + 0.45 * sin(df * 2.1 + 0.35)) * (0.68 + 0.32 * exp(-cx * cx));
let w1 = 0.36 + 0.12 * h.y - df * 0.04;
let sl = step(0.86, r.x) * select(abs(xl), (xl * sign(r.y - 0.5) + w1) * 0.5, r.x > 0.93) * h1 * 0.25;
let z1 = step(0.5, r.x) * step(r.x, 0.86);
let z2 = step(0.7, r.x) * z1;
let sp = step(1.0 - P.spires * 0.6, r.y) * step(r.x, 0.86) * step(0.65, h.x);
let top = h1 * (1.0 + 0.1 * z1 + 0.08 * z2) - sl;
let h3 = h1 * 0.2 * sp;
let sx = abs(xl) - select(0.0, w1 * 0.24, z2 * h.x > 0.75);
let d1 = min(bx(xl, ly, w1, h1 - sl), min(bx(xl, ly, w1 * 0.68, h1 + h1 * 0.1 * z1 - sl), bx(xl, ly, w1 * 0.42, top)));
let d = min(d1, bx(sx, ly, max(0.012, px * f * 0.7), top + h3));
let m = 1.0 - smoothstep(0.0, px * 1.3, d);
let bk = max(0.0, sin(ctx.time * 3.0 + id * 2.3));
let tip = exp(-length(vec2f(sx / f, ly - top - h3)) / px * 0.38) * (bk * bk * bk * bk + 0.25) * sp;
let wuv = vec2f(xl / w1 * 0.5 + 0.5, ly) * vec2f(round(8.0 + 10.0 * h.y), 75.0);
let wid = floor(wuv);
let pn = step(abs(fract(wuv) - 0.5), vec2f(select(0.32, 0.46, r.y > 0.7), select(0.28, 0.44, r.y < 0.2)));
let wh = noise_hash22(wid + vec2f(id * 17.0, fi + P.seed));
let occ = mix(0.15, 0.58, step(0.4, fract(wid.y * 0.37 + h.x))) * min(1.0, 0.25 + df * 2.2);
let on = step(1.0 - P.windows * occ, wh.x * 0.88 + sin(ctx.time * 0.4 + wh.y * 12.0) * 0.08) + step(h1 - sl - 0.015, ly) * step(0.65, h.y);
let w = (mix(P.windows * 0.18 * df, pn.x * pn.y * on, smoothstep(120.0, 250.0, ctx.res.y)) + ly / h1 * 0.2 * h.x) * step(d1, -px * 2.0) * P.windows * (1.0 - df * 0.55);
let rim = (smoothstep(-px * 2.5, 0.0, d) + smoothstep(w1 * 0.6, w1, -xl) * 0.25) * P.rim * (0.35 + 0.65 * df);
let fog = min(0.95, (1.0 - exp(-P.haze * 2.5 * df)) * (1.2 - ly / tall * 0.4));
let fac = mix(mix(mix(c[0], c[3], min(1.0, rim)), c[1], max(0.0, fog)), mix(c[2], c[3], wh.y * 0.5), min(1.0, w));
col = mix(mix(col, fac, m), c[2], min(1.0, tip));
alpha = max(alpha, max(m, tip));
}
return vec4f(col, min(1.0, alpha) * smoothstep(0.98, 0.9, uv.y));
}
`,
  css: ({ colors, params, opacity }) => {
    const [near, far] = colors.map((c) => formatOklch({ ...c, alpha: opacity }))
    return [`linear-gradient(in oklab to top, ${near!} 0, ${far!} ${Math.round(params.height * 100)}%, transparent)`]
  },
})
