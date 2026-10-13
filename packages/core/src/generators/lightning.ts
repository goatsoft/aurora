import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Lightning: now and then a bolt forks down from the top of the canvas and the sky flashes. Time
 * is cut into windows; a hash decides whether each window strikes, when, and where. A strike grows
 * from the top in about a tenth of a second, holds, then fades, while the flash double-flickers
 * (a bright tap, then a fainter one). The bolt is a jagged path built from a few octaves of
 * linearly interpolated hashes, with a glow around a thin core and up to two short branches.
 * The flash is brightest at the top. Transparent between strikes: use it with the screen blend
 * over a dark, stormy scene.
 *
 * The strike timing and the double flicker follow the storm flashes in LoP-Engine.
 */
export const lightning = defineGenerator({
  id: 'lightning',
  label: 'Lightning',
  description: 'Air: forked lightning and sky flashes, for storms.',
  colors: 2,
  palette: ['oklch(0.82 0.06 255)', 'oklch(0.98 0.03 250)'],
  requires: ['hash'],
  params: {
    frequency: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Frequency', description: 'How often lightning strikes.' },
    flash: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Flash', description: 'How brightly the sky lights up.' },
    bolt: { default: 1, min: 0, max: 1, step: 0.01, label: 'Bolt', description: 'How bright the bolt is; 0 for flashes only.' },
    width: { default: 1, min: 0.3, max: 3, step: 0.05, label: 'Width', description: 'Thickness of the bolt.' },
    reach: { default: 0.85, min: 0.2, max: 1, step: 0.01, label: 'Reach', description: 'How far down the canvas a bolt can reach.' },
    branches: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Branches', description: 'How often a bolt forks.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different storm.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn jag(y: f32, k: f32) -> f32 {
  let i = floor(y);
  return mix(noise_hash21(vec2f(i, k)), noise_hash21(vec2f(i + 1.0, k)), fract(y)) - 0.5;
}
fn bolt_path(y: f32, k: f32) -> f32 {
  return jag(y * 6.0, k) * 0.16 + jag(y * 17.0, k + 1.0) * 0.06 + jag(y * 41.0, k + 2.0) * 0.02;
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 2>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let p = vec2f(ctx.uv.x * aspect, ctx.uv.y);
  let period = mix(9.0, 2.5, P.frequency);
  let w = floor(ctx.time / period);
  let k = w * 13.0 + P.seed * 101.0;
  let fires = step(0.25 - 0.2 * P.frequency, noise_hash21(vec2f(k, 1.0))) * step(0.001, P.frequency);
  let dt = ctx.time - w * period - noise_hash21(vec2f(k, 2.0)) * (period - 1.0) * 0.8;
  if (fires < 0.5 || dt < 0.0) { return vec4f(0.0); }
  let flash = (exp(-dt * 7.0) + 0.55 * exp(-(dt - 0.15) * 9.0) * step(0.15, dt)) * P.flash * mix(0.9, 0.3, ctx.uv.y);
  let grow = clamp(dt / 0.12, 0.0, 1.0);
  let fade = select(1.0, exp(-(dt - 0.25) * 6.0), dt > 0.25);
  let x0 = (0.15 + 0.7 * noise_hash21(vec2f(k, 3.0))) * aspect;
  let end = P.reach * (0.75 + 0.25 * noise_hash21(vec2f(k, 4.0)));
  let tip = end * grow;
  let px = 1.0 / ctx.res.y;
  let hw = P.width * 0.003 + px * 0.5;
  // Past the tip, the distance is to the tip itself, so the bolt and its glow end round, not cut.
  let head = vec2f(x0 + bolt_path(tip, k), tip);
  var d = select(abs(p.x - x0 - bolt_path(p.y, k)), length(p - head), p.y > tip);
  for (var b = 0; b < 2; b++) {
    let fb = f32(b);
    if (noise_hash21(vec2f(k, 5.0 + fb)) > P.branches) { continue; }
    let y0 = end * (0.25 + 0.4 * noise_hash21(vec2f(k, 7.0 + fb)));
    let dir = sign(noise_hash21(vec2f(k, 9.0 + fb)) - 0.5);
    let along = p.y - y0;
    let reach = end * 0.3;
    let bx = x0 + bolt_path(y0, k) + dir * along * 0.7 + bolt_path(p.y, k + 20.0 + fb) * 0.6;
    let len = min(reach, tip - y0);
    if (len <= 0.0) { continue; }
    let ey = y0 + len;
    let end_b = vec2f(x0 + bolt_path(y0, k) + dir * len * 0.7 + bolt_path(ey, k + 20.0 + fb) * 0.6, ey);
    let db = select(abs(p.x - bx), length(p - end_b), along > len);
    d = min(d, select(db * (1.0 + min(along, len) / reach), 1e3, along < 0.0));
  }
  let core = 1.0 - smoothstep(hw, hw + px, d);
  let glow = exp(-d / (P.width * 0.02)) * 0.7;
  let light = (core + glow) * fade * P.bolt;
  let total = light + flash;
  let col = mix(c[0], c[1], light / max(total, 1e-4));
  return vec4f(col, clamp(total, 0.0, 1.0));
}
`,
  // A still picture can't flash, so the fallback is a faint glow of the flash colour at the top.
  css: ({ colors, params, space, opacity }) => {
    const glow = formatOklch({ ...colors[0]!, alpha: params.flash * 0.12 * opacity })
    return [`linear-gradient(in ${space} to bottom, ${glow}, transparent 60%)`]
  },
})
