import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * City: an architectural suspension bridge and elevated transit viaduct spanning the canvas, with
 * twin towers, catenary main cables, vertical suspenders, necklace deck lamps and luminous express
 * trains gliding in both directions. Transparent around the structure so it layers over a skyline,
 * harbor, river or fog bank.
 */
export const transit = defineGenerator({
  id: 'transit',
  label: 'Bridge & transit',
  description: 'City: suspension bridge and elevated viaduct with moving transit trains.',
  colors: 3,
  palette: ['oklch(0.08 0.02 255)', 'oklch(0.88 0.13 80)', 'oklch(0.84 0.12 215)'],
  requires: ['hash'],
  params: {
    altitude: { default: 0.26, min: 0.08, max: 0.65, step: 0.01, label: 'Deck height', description: 'Bridge deck height.' },
    towers: { default: 2, min: 0, max: 3, step: 1, label: 'Towers', description: 'Suspension towers; 0 for viaduct.' },
    span: { default: 0.34, min: 0.15, max: 0.55, step: 0.01, label: 'Tower height', description: 'Tower height above deck.' },
    cables: { default: 0.75, min: 0, max: 1, step: 0.01, label: 'Cables', description: 'Cables and piers.' },
    trains: { default: 0.85, min: 0, max: 1, step: 0.01, label: 'Trains', description: 'Train glow and density.' },
    lights: { default: 0.75, min: 0, max: 1, step: 0.01, label: 'Lights', description: 'Deck and beacon lights.' },
    speed: { default: 0.5, min: 0, max: 2, step: 0.01, label: 'Speed', description: 'Train speed.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'Random seed.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn ss(a: f32, b: f32, x: f32) -> f32 { return 1.0 - smoothstep(a, b, x); }
fn rp(x: f32, s: f32) -> f32 { return abs(fract(x * s) - 0.5) / s; }
fn sf(z: f32, e: f32, w: f32) -> f32 { return smoothstep(e - w, e + w, abs(fract(z) - 0.5)); }
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
let a = ctx.res.x / ctx.res.y;
let px = 1.0 / ctx.res.y;
let x = (ctx.uv.x - 0.5) * a + (noise_hash21(vec2f(P.seed, 3.0)) - 0.5) * 0.18;
let dy = 1.0 - ctx.uv.y - P.altitude;
let dh = max(0.011, px * 2.5);
var mask = ss(dh - px, dh + px, abs(dy)) * (0.65 + 0.35 * mix(0.5, sf(x * 38.0, 0.25, px * 42.0), ss(0.1, 0.28, px * 42.0)));
if (dy < 0.0) {
mask = max(mask, ss(0.012 - dy * 0.025 - px, 0.012 - dy * 0.025 + px, rp(x + 0.16, 3.125)) * P.cables);
}
let nt = i32(P.towers);
var bc = 0.0;
var cl = 0.0;
if (nt > 0) {
let sp = a / (f32(nt) + 0.45);
let hp = f32(nt - 1) * 0.5;
let tid = clamp(round(x / sp - hp) + hp, -hp, hp);
let tx = x - tid * sp;
let th = P.span * min(1.0, a);
let tw = max(0.014, px * 2.8);
let leg = ss(tw - px, tw + px, abs(abs(tx) - tw * 1.1));
let strut = ss(0.0, px * 2.2, rp(dy, 1.0 / (th * 0.28))) * step(abs(tx), tw * 2.1) * step(0.0, dy);
mask = max(mask, max(leg, strut) * step(-P.altitude, dy) * step(dy, th));
bc = exp(-length(vec2f(tx, dy - th)) / px * 0.35) * (0.55 + 0.45 * sin(ctx.time * 2.8 + tid * 2.1)) * P.lights;
if (dy > 0.0 && dy < th * 1.05 && abs(tx) < sp * 0.52) {
let sag = 1.0 - min(abs(tx) / (sp * 0.5), 1.0);
let cy = th * (0.06 + 0.92 * sag * sag);
let cd = abs(dy - cy);
mask = max(mask, max(ss(px * 0.4, px * 2.2, cd), ss(0.0, px * 1.6, rp(x, 32.0)) * step(dy, cy) * 0.55) * P.cables);
cl = exp(-cd / (px * 2.5)) * ss(0.0, px * 3.0, rp(x, 16.0)) * P.lights * P.cables;
}
}
let lq = rp(x, 24.0) * 84.0;
var warm = exp(-abs(dy - dh) / (px * 2.5)) * (0.35 + 0.65 * exp(-lq * lq)) * P.lights + cl;
var cool = 0.0;
let wfw = px * 62.0;
let pw = px * 11.0;
let wvis = ss(0.14, 0.32, wfw);
for (var dir = -1; dir <= 1; dir += 2) {
let fd = f32(dir);
let ly = dh * (1.4 + 0.45 * fd);
let tc = (x * fd - ctx.time * P.speed * (0.35 + 0.03 * fd) + P.seed * 1.7 + 0.8 + fd * 2.0) / 3.8;
let cell = floor(tc);
let h = noise_hash21(vec2f(cell, fd * 13.0 + P.seed));
let loc = (fract(tc) - 0.5) * 3.8;
let len = 0.16 + 0.12 * h;
let on = step(fract(cell * 0.62 + fd * 0.2 + P.seed * 0.25), P.trains * 0.75);
let tr = ss(len - px * 2.0, len, abs(loc)) * ss(dh * 0.15, dh * 0.55, abs(dy - ly)) * on;
let win = mix(0.64, sf(loc * 52.0, 0.18, wfw), wvis) * sf(loc * 18.0, 0.03 + pw, pw);
let wa = tr * (0.25 + 0.75 * win) + exp(-length(vec2f(loc - len, dy - ly)) / (px * 5.0)) * on;
mask = max(mask, tr);
if (dir > 0) { warm += wa; } else { cool += wa; }
}
let yf = smoothstep(0.04, 0.12, ctx.uv.y);
let lit = clamp(warm + cool + bc, 0.0, 1.3) * yf;
let col = mix(c[0], mix(c[1], c[2], clamp((cool + bc * 0.4) / max(lit, 1e-4), 0.0, 1.0)), min(1.0, lit));
return vec4f(col, min(1.0, max(mask * yf, lit * 0.85)));
}
`,
  css: ({ colors, params, opacity }) => {
    const [structure, warm] = colors
    const y = 100 - Math.round(params.altitude * 100)
    return [
      `linear-gradient(in oklab to bottom, transparent ${Math.max(0, y - 3)}%, ${formatOklch({ ...warm!, alpha: opacity * params.lights * 0.65 })} ${y - 1}%, ${formatOklch({ ...structure!, alpha: opacity })} ${y}% ${Math.min(100, y + 2)}%, transparent ${Math.min(100, y + 5)}%)`,
    ]
  },
})
