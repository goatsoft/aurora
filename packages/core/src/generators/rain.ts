import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Rain: falling streaks in three depths, leaning with the wind. Far drops are thin, short and
 * faint, near ones wider, longer and brighter, and the rain thickens towards the bottom of the
 * canvas, for a sense of depth. Streak widths are in canvas pixels, so thin rain stays crisp at
 * any size. `haze` adds a soft veil of the drop colour, heavier near the ground. Transparent
 * between the drops, so it sits over any scene.
 *
 * Ported from the precipitation overlay in LoP-Engine, with its `fract(sin)` hash swapped for the
 * noise library's integer hash so it renders the same on every GPU and CPU.
 */
export const rain = defineGenerator({
  id: 'rain',
  label: 'Rain',
  description: 'Air: falling rain in three depths, leaning with the wind.',
  colors: 1,
  palette: ['oklch(0.86 0.03 240)'],
  requires: ['hash'],
  params: {
    amount: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Amount', description: 'Higher gives heavier rain, from a few drops to a downpour.' },
    speed: { default: 1, min: 0, max: 3, step: 0.01, label: 'Speed', description: 'How fast the drops fall.' },
    wind: { default: 0.2, min: -1, max: 1, step: 0.01, label: 'Wind', description: 'How far the rain leans, and which way.' },
    length: { default: 0.5, min: 0.1, max: 1, step: 0.01, label: 'Length', description: 'Higher gives longer streaks.' },
    haze: { default: 0.2, min: 0, max: 1, step: 0.01, label: 'Haze', description: 'A soft veil of rain, heavier near the ground.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'Different drops.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 1>) -> vec4f {
  let uv = ctx.uv;
  let aspect = ctx.res.x / ctx.res.y;
  var acc = 0.0;
  for (var i = 0; i < 3; i++) {
    let fi = f32(i);
    let near = fi * 0.5;
    let cols = (80.0 - fi * 22.0) * aspect;
    let x = (uv.x - P.wind * 0.3 * uv.y * (0.7 + 0.3 * fi)) * cols + P.seed * 17.0;
    let col = floor(x);
    let h = noise_hash22(vec2f(col, fi * 31.0 + P.seed));
    let y = fract(uv.y * (2.0 + fi) - ctx.time * P.speed * (1.2 + h.x * 0.8 + fi * 0.6) + h.y);
    let pc = cols / ctx.res.x;
    let w = (0.15 + 0.35 * near) * pc;
    let streak = 1.0 - smoothstep(w, w + pc, abs(fract(x) - 0.5));
    let len = P.length * (0.6 + 0.6 * near) * mix(0.6, 1.0, uv.y);
    let tail = smoothstep(0.0, 0.02, y) * smoothstep(len, 0.0, y);
    let on = step(1.0 - P.amount * (0.45 + 0.15 * fi), noise_hash21(vec2f(col + 0.5, fi * 7.0 + P.seed + 3.0)));
    acc += streak * tail * on * (0.16 + 0.3 * near);
  }
  let veil = P.haze * P.amount * 0.35 * smoothstep(0.1, 1.0, uv.y);
  return vec4f(c[0], clamp(acc * mix(0.5, 1.0, uv.y) + veil, 0.0, 1.0));
}
`,
  // The haze, without the drops.
  css: ({ colors, params, space, opacity }) => {
    const veil = formatOklch({ ...colors[0]!, alpha: params.haze * params.amount * 0.35 * opacity })
    return [`linear-gradient(in ${space} to bottom, transparent 10%, ${veil})`]
  },
})
