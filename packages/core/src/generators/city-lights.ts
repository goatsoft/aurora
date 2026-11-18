import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * City: a perspective-foreshortened sea of urban lights below the horizon, with glowing arterial
 * boulevards, drifting traffic pulses, dense neighbourhood light clusters and soft foreground
 * bokeh. Transparent above the horizon so it layers cleanly under or over a skyline or mountain
 * range.
 */
export const cityLights = defineGenerator({
  id: 'city-lights',
  label: 'City lights',
  description: 'City: a sprawling grid of street lights, glowing boulevards and soft foreground bokeh below the horizon.',
  colors: 3,
  palette: ['oklch(0.07 0.02 255)', 'oklch(0.86 0.14 75)', 'oklch(0.88 0.11 215)'],
  requires: ['fbm', 'hash'],
  params: {
    horizon: { default: 0.32, min: 0.1, max: 0.75, step: 0.01, label: 'Horizon', description: 'Height of the urban sprawl from the bottom of the canvas.' },
    density: { default: 0.7, min: 0.1, max: 1, step: 0.01, label: 'Density', description: 'How much of the basin is filled with street and building lights.' },
    streets: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Boulevards', description: 'Brightness of the arterial roads and moving traffic streams.' },
    bokeh: { default: 0.45, min: 0, max: 1, step: 0.01, label: 'Bokeh', description: 'Soft out-of-focus light halos in the foreground.' },
    twinkle: { default: 0.45, min: 0, max: 1, step: 0.01, label: 'Shimmer', description: 'Heat-haze shimmer across distant lights.' },
    speed: { default: 0.25, min: 0, max: 2, step: 0.01, label: 'Speed', description: 'How fast traffic flows and distant lights shimmer.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different street grid.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let px = 1.0 / ctx.res.y;
  let top = 1.0 - P.horizon;
  let mask = smoothstep(top - px * 2.0, top + px * 3.0, ctx.uv.y);
  let haze = exp(-max(top - ctx.uv.y, 0.0) / max(P.horizon * 0.35, 0.04)) * smoothstep(max(0.08, top - P.horizon * 0.4), top, ctx.uv.y) * P.density * 0.4;
  if (mask <= 1e-4 && haze <= 1e-4) { return vec4f(c[1], 0.0); }
  let v = clamp((ctx.uv.y - top) / max(P.horizon, 0.05), 0.0, 1.0);
  let z = 1.0 / (0.14 + 0.86 * pow(v, 0.78));
  let w = vec2f((ctx.uv.x - 0.5) * aspect * z + P.seed * 7.1, z * 3.4 + P.seed * 11.3);
  let t = ctx.time * P.speed;
  let zone = smoothstep(1.0 - P.density * 0.88, 0.95, noise_fbm(w * 0.35, 2) * 0.5 + 0.5);
  let gp = w * min(18.0, ctx.res.y * 0.075 / max(z * 0.12, 0.25));
  let gh = noise_hash22(floor(gp) + P.seed * 13.0);
  let shim = 1.0 - P.twinkle * 0.4 * (0.5 + 0.5 * sin(t * (3.5 + gh.x * 5.0) + gh.y * 40.0));
  let r = 0.18 + 0.22 * gh.x;
  let dotL = smoothstep(r, r * 0.2, length(fract(gp) - 0.5 + (gh - 0.5) * 0.38)) * step(1.0 - P.density * 0.78, gh.y) * shim * zone;
  let df = exp(-max(z - 1.0, 0.0) * 0.32);
  let hb = exp(-v * 7.5) * P.density * 0.75;
  let s = vec2f(w.x * 2.2 + w.y * 0.38, w.y * 1.6 - w.x * 0.22);
  let rw = max(0.04, 1.8 * z / ctx.res.x);
  let road = (exp(-abs(fract(s.x) - 0.5) / rw) * (0.55 + 0.45 * sin(w.y * 6.0 - t * 4.2 + floor(s.x) * 3.7))
    + exp(-abs(fract(s.y) - 0.5) / (rw * 1.25)) * (0.55 + 0.45 * sin(w.x * 5.0 + t * 3.6 + floor(s.y) * 5.1)) * 0.75) * P.streets * zone * df;
  let bq = vec2f(ctx.uv.x * 14.0 * aspect, v * 9.0) + P.seed * 4.1;
  var bk = vec2f(0.0);
  for (var j = -1; j <= 1; j++) {
    for (var i = -1; i <= 1; i++) {
      let id = floor(bq) + vec2f(f32(i), f32(j));
      let bh = noise_hash22(id + P.seed * 19.0);
      if (bh.x > P.density * 0.55) { continue; }
      let br = (0.22 + 0.32 * bh.y) * (0.45 + 0.55 * v);
      let disc = smoothstep(br, br * 0.35, length((bq - (id + 0.2 + 0.6 * bh)) * vec2f(1.0, 1.35))) * (1.0 - P.twinkle * 0.25 * (0.5 + 0.5 * sin(t * (1.8 + bh.x * 2.2) + bh.y * 25.0))) * v;
      bk += vec2f(disc, disc * step(0.58, bh.y));
    }
  }
  let bAmt = bk.x * P.bokeh * smoothstep(0.15, 0.95, v);
  let br = select(0.0, bk.y / bk.x, bk.x > 1e-4);
  let warm = clamp(dotL * mix(0.4, 1.0, df) + hb + road * 0.85 + bAmt * (1.0 - br), 0.0, 1.35);
  let cool = clamp(dotL * step(0.65, gh.x) * 0.85 + road * 0.45 + bAmt * br + hb * 0.35, 0.0, 1.2);
  let gnd = mix(c[0], mix(c[1], c[2], clamp(cool / max(warm + cool, 1e-4), 0.0, 1.0)), clamp(warm * 0.72 + cool * 0.55, 0.0, 1.0));
  return vec4f(mix(mix(c[1], c[2], 0.35), gnd, mask), clamp(max(mask, haze), 0.0, 1.0));
}
`,
  css: ({ colors, params, opacity }) => {
    const [ground, warm, cool] = colors
    const h = Math.round(params.horizon * 100)
    return [
      `radial-gradient(60% ${Math.round(h * 0.8)}% at 50% ${100 - Math.round(h * 0.55)}% in oklab, ${formatOklch({ ...warm!, alpha: opacity * params.density * 0.55 })}, ${formatOklch({ ...cool!, alpha: opacity * params.density * 0.25 })} 55%, transparent)`,
      `linear-gradient(in oklab to top, ${formatOklch({ ...ground!, alpha: opacity })} 0 ${Math.round(h * 0.75)}%, ${formatOklch({ ...warm!, alpha: opacity * 0.45 })} ${h}%, transparent ${Math.min(100, h + 12)}%)`,
    ]
  },
})
