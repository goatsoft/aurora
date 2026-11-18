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
  description: 'City: a suspension bridge and elevated transit viaduct with glowing train cars and deck lamps.',
  colors: 3,
  palette: ['oklch(0.08 0.02 255)', 'oklch(0.88 0.13 80)', 'oklch(0.84 0.12 215)'],
  requires: ['hash'],
  params: {
    altitude: { default: 0.26, min: 0.08, max: 0.65, step: 0.01, label: 'Deck height', description: 'Height of the bridge deck from the bottom of the canvas.' },
    towers: { default: 2, min: 0, max: 3, step: 1, label: 'Towers', description: 'Suspension towers and cable spans; 0 for a plain elevated viaduct.' },
    span: { default: 0.34, min: 0.15, max: 0.55, step: 0.01, label: 'Tower height', description: 'Height of the suspension towers above the deck.' },
    cables: { default: 0.75, min: 0, max: 1, step: 0.01, label: 'Cables', description: 'Visibility of catenary cables, suspenders and piers.' },
    trains: { default: 0.85, min: 0, max: 1, step: 0.01, label: 'Trains', description: 'Frequency and brightness of glowing transit trains.' },
    lights: { default: 0.75, min: 0, max: 1, step: 0.01, label: 'Lights', description: 'Brightness of deck lamps and tower beacons.' },
    speed: { default: 0.5, min: 0, max: 2, step: 0.01, label: 'Speed', description: 'How fast trains cross the span.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different span and train schedule.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let px = 1.0 / ctx.res.y;
  let x = (ctx.uv.x - 0.5) * aspect + (noise_hash21(vec2f(P.seed, 3.0)) - 0.5) * 0.18;
  let dy = 1.0 - ctx.uv.y - P.altitude;
  let dh = max(0.011, px * 2.5);
  var mask = smoothstep(dh + px, dh - px, abs(dy)) * (0.65 + 0.35 * step(0.25, abs(fract(x * 38.0) - 0.5)));
  if (dy < 0.0) {
    let ps = 0.32;
    let pp = abs(fract(x / ps + 0.5) - 0.5) * ps;
    let pw = 0.012 - dy * 0.025;
    mask = max(mask, smoothstep(pw + px, pw - px, pp) * P.cables);
  }
  let nt = i32(P.towers);
  var beacon = 0.0;
  var cLight = 0.0;
  if (nt > 0) {
    let sp = aspect / (f32(nt) + 0.55);
    let tid = clamp(round(x / sp), -f32(nt - 1) * 0.5, f32(nt - 1) * 0.5);
    let tx = x - tid * sp;
    let th = P.span * min(1.0, aspect);
    let tw = max(0.014, px * 2.8);
    let leg = smoothstep(tw + px, tw - px, abs(abs(tx) - tw * 1.1));
    let strut = smoothstep(px * 2.2, 0.0, abs(fract(dy / (th * 0.28)) - 0.5) * th * 0.28) * step(abs(tx), tw * 2.1) * step(0.0, dy);
    mask = max(mask, max(leg, strut) * step(-P.altitude, dy) * step(dy, th));
    beacon = exp(-length(vec2f(tx, dy - th)) / px * 0.35) * (0.55 + 0.45 * sin(ctx.time * 2.8 + tid * 2.1)) * P.lights;
    if (dy > 0.0 && dy < th * 1.05) {
      let sag = 1.0 - clamp(abs(tx) / (sp * 0.5), 0.0, 1.1);
      let cy = th * (0.06 + 0.92 * sag * sag);
      let cd = abs(dy - cy);
      let mc = smoothstep(px * 2.2, px * 0.4, cd);
      let su = smoothstep(px * 1.6, 0.0, abs(fract(x * 32.0) - 0.5) / 32.0) * step(dy, cy) * 0.55;
      mask = max(mask, max(mc, su) * P.cables);
      cLight = exp(-cd / (px * 2.5)) * smoothstep(px * 3.0, 0.0, abs(fract(x * 16.0) - 0.5) / 16.0) * P.lights * P.cables;
    }
  }
  var warm = exp(-abs(dy - dh) / (px * 2.5)) * (0.35 + 0.65 * exp(-pow((fract(x * 24.0) - 0.5) * 3.5, 2.0))) * P.lights + cLight;
  var cool = 0.0;
  for (var dir = -1; dir <= 1; dir += 2) {
    let fd = f32(dir);
    let ly = dh * select(1.15, 1.75, dir > 0);
    let tx = x * fd - ctx.time * P.speed * (0.38 + 0.09 * fd) + P.seed * 1.7 + fd * 0.4;
    let h = noise_hash21(vec2f(floor(tx / 1.4), fd * 13.0 + P.seed));
    let loc = (fract(tx / 1.4) - 0.5) * 1.4;
    let len = 0.16 + 0.14 * h;
    let tr = smoothstep(len, len - px * 2.0, abs(loc)) * smoothstep(dh * 0.75, dh * 0.2, abs(dy - ly)) * step(h, P.trains * 0.85);
    let win = step(0.18, abs(fract(loc * 72.0) - 0.5)) * smoothstep(0.03, 0.09, abs(fract(loc * 18.0) - 0.5));
    let wAmt = tr * (0.25 + 0.75 * win) + exp(-length(vec2f(loc - len, dy - ly)) / (px * 5.0)) * step(h, P.trains * 0.85);
    mask = max(mask, tr);
    if (dir > 0) { warm += wAmt; } else { cool += wAmt; }
  }
  let lit = clamp(warm + cool + beacon, 0.0, 1.3) * smoothstep(0.04, 0.12, ctx.uv.y);
  let col = mix(c[0], mix(c[1], c[2], clamp((cool + beacon * 0.4) / max(lit, 1e-4), 0.0, 1.0)), clamp(lit, 0.0, 1.0));
  return vec4f(col, clamp(max(mask * smoothstep(0.04, 0.12, ctx.uv.y), lit * 0.85), 0.0, 1.0));
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
