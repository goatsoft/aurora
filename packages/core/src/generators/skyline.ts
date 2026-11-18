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
  description: 'City: layered towers with lit windows and spires.',
  colors: 4,
  palette: ['oklch(0.08 0.025 250)', 'oklch(0.32 0.065 232)', 'oklch(0.92 0.08 85)', 'oklch(0.75 0.11 218)'],
  requires: ['hash'],
  params: {
    rows: { default: 5, min: 1, max: 5, step: 1, label: 'Rows', description: 'Tower rows.' },
    density: { default: 6, min: 2.5, max: 14, step: 0.5, label: 'Density', description: 'Grid density.' },
    height: { default: 0.54, min: 0.15, max: 0.85, step: 0.01, label: 'Height', description: 'Tower height.' },
    spires: { default: 0.55, min: 0, max: 1, step: 0.01, label: 'Spires', description: 'Crowns and spires.' },
    windows: { default: 0.82, min: 0, max: 1, step: 0.01, label: 'Windows', description: 'Window light.' },
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
let yt = uv.y / tall;
var col = c[1] * (1.2 - yt * 0.6);
var alpha = P.haze * 0.85 * exp(-max(0.0, yt - 0.5) * 2.5) * (1.0 - smoothstep(0.25, 0.95, uv.y));
for (var k = 0; k < 9; k++) {
let fi = n - 1.0 - f32(k);
if (fi < 0.0) { break; }
let df = fi / max(1.0, n - 1.0);
let f = P.density * (0.8 + df * 1.45);
let u = uv.x + (ctx.time * P.speed * 0.08 / (1.0 + fi * 0.35)) % 64.0;
let xs = u * f + fi * 1.7 + P.seed * 3.1;
let id = floor(xs);
let hx = (fract(xs) - 0.5) / f;
let ly = max(0.0, uv.y - df * tall * 0.35);
let sd = fi + P.seed;
let h = noise_hash22(vec2f(id, fi * 17.0 + sd));
let r = noise_hash22(vec2f(id + 29.1, sd));
let hw = (0.35 + 0.12 * h.y - df * 0.04) / f;
let rx = hx / hw;
let cx = u - hx;
let h1 = tall * mix(0.28 + 0.35 * h.x, 0.7 + 0.3 * r.x, step(0.8, h.x)) * (0.55 + 0.45 * sin(df * 2.0 + 0.35)) * (0.68 + 0.32 * exp(-cx * cx));
let sl = step(0.85, r.x) * select(abs(rx), (rx * sign(r.y - 0.5) + 1.0) * 0.5, r.x > 0.92) * h1 * 0.1;
let nr = step(r.x, 0.85);
let z1 = step(0.5, r.x) * nr;
let z2 = step(0.7, r.x) * z1;
let sp = step(1.0 - P.spires * 0.6, r.y) * nr * step(0.65, h.x);
let hsx = abs(hx) - select(0.0, hw * 0.25, z2 * h.x > 0.7);
let t0 = h1 - sl;
let top = t0 + h1 * (0.1 * z1 + 0.08 * z2);
let h3 = top + h1 * 0.2 * sp;
let d1 = min(bx(hx, ly, hw, t0), min(bx(hx, ly, hw * 0.65, t0 + h1 * 0.1 * z1), bx(hx, ly, hw * 0.4, top)));
let d = min(d1, bx(hsx, ly, max(0.012 / f, px * 0.7), h3));
let m = 1.0 - smoothstep(0.0, px * 1.2, d);
let bk = max(0.0, sin(ctx.time * 1.4 + id * 2.0));
let tip = exp(-length(vec2f(hsx, ly - h3)) / px * 0.45) * (bk * bk * bk * bk * 0.6 + 0.15) * sp * step(0.7, h.x);
let wf = vec2f(round(6.0 + 6.0 * h.y), 56.0);
let wuv = vec2f(rx * 0.5 + 0.5, ly) * wf;
let wi = floor(wuv);
let pw = vec2f(select(0.32, 0.45, r.y > 0.7), select(0.28, 0.45, r.y < 0.2));
let pf = 0.85 * wf * px / vec2f(2.0 * hw, 1.0);
let pn = 1.0 - smoothstep(pw - pf, pw + pf, abs(fract(wuv) - 0.5));
let wh = noise_hash22(wi + vec2f(id * 17.0, sd));
let po = P.windows * (0.2 + 0.4 * step(0.4, fract(wi.y * 0.35 + h.x))) * min(1.0, 0.25 + df * 2.0);
let on = step(1.0 - po, wh.x) + step(t0 - 0.012, ly) * step(0.65, h.y);
let w = (mix(4.0 * pw.x * pw.y * po, pn.x * pn.y * on, 1.0 - smoothstep(0.25, 0.55, max(pf.x, pf.y))) + ly / h1 * 0.2 * h.x) * step(d1, -px * 2.0) * P.windows * (1.0 - df * 0.55);
let rim = (smoothstep(-px * 2.5, 0.0, d) + smoothstep(0.6, 1.0, -rx) * 0.25) * P.rim * (0.35 + 0.65 * df);
let fog = min(0.95, (1.0 - exp(-P.haze * 2.5 * df)) * (1.2 - ly / tall * 0.4));
let fac = mix(mix(mix(c[0], c[3], min(1.0, rim)), c[1], fog), mix(c[2], c[3], wh.y * 0.5), min(1.0, w));
col = mix(mix(col, fac, m), c[2], min(1.0, tip));
alpha = max(alpha, max(m, tip));
}
return vec4f(col, min(1.0, alpha) * (1.0 - smoothstep(0.85, 0.95, uv.y)));
}
`,
  css: ({ colors, params, opacity }) => {
    const [near, far] = colors.map((c) => formatOklch({ ...c, alpha: opacity }))
    return [`linear-gradient(in oklab to top, ${near!} 0, ${far!} ${Math.round(params.height * 100)}%, transparent)`]
  },
})
