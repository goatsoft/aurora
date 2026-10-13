import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * A plain linear gradient, as CSS draws it: an angle, two to four stops from the palette in order,
 * and where the inner stops sit. It uses CSS's gradient line, so the WebGPU frame and the CSS
 * fallback match exactly; `drift` turns it slowly. A sky behind mountains, a wash under a pattern,
 * or a background on its own.
 */
export const linearGradient = defineGenerator({
  id: 'linear-gradient',
  label: 'Linear gradient',
  description: 'A straight gradient through two to four colours, like CSS linear-gradient().',
  colors: 4,
  palette: ['oklch(0.16 0.05 275)', 'oklch(0.32 0.11 295)', 'oklch(0.55 0.16 330)', 'oklch(0.78 0.13 60)'],
  params: {
    angle: { default: 180, min: 0, max: 360, step: 1, label: 'Angle', description: 'Direction, as in CSS: 0 points up, 90 right, 180 down.', unit: 'deg' },
    stops: { default: 3, min: 2, max: 4, step: 1, label: 'Stops', description: 'How many palette colours the gradient runs through, in order.' },
    stop2: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Stop 2', description: 'Where the second colour sits along the gradient.' },
    stop3: { default: 0.75, min: 0, max: 1, step: 0.01, label: 'Stop 3', description: 'Where the third colour sits, with four stops.' },
    drift: { default: 0, min: -30, max: 30, step: 0.1, label: 'Drift', description: 'Turns the gradient slowly; 0 keeps it still.', unit: 'deg/s' },
  },
  wgsl: /* wgsl */ `
fn ramp(a: vec3f, b: vec3f, lo: f32, hi: f32, x: f32) -> vec3f {
  return mix(a, b, clamp((x - lo) / max(hi - lo, 1e-4), 0.0, 1.0));
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 4>) -> vec4f {
  let a = radians(P.angle + P.drift * ctx.time);
  // CSS: 0deg points up, uv runs down, and the gradient line just reaches the far corners.
  let dir = vec2f(sin(a), -cos(a));
  let span = abs(ctx.res.x * dir.x) + abs(ctx.res.y * dir.y);
  let x = dot((ctx.uv - 0.5) * ctx.res, dir) / span + 0.5;
  let n = i32(round(P.stops));
  let s2 = clamp(P.stop2, 0.0, 1.0);
  let s3 = clamp(P.stop3, s2, 1.0);
  var col = ramp(c[0], c[1], 0.0, 1.0, x);
  if (n == 3) {
    col = select(ramp(c[1], c[2], s2, 1.0, x), ramp(c[0], c[1], 0.0, s2, x), x < s2);
  } else if (n >= 4) {
    col = select(select(ramp(c[2], c[3], s3, 1.0, x), ramp(c[1], c[2], s2, s3, x), x < s3), ramp(c[0], c[1], 0.0, s2, x), x < s2);
  }
  return vec4f(col, 1.0);
}
`,
  css: ({ colors, params, space, opacity }) => {
    const n = Math.round(Math.min(4, Math.max(2, params.stops)))
    const stop2 = Math.min(1, Math.max(0, params.stop2))
    const stop3 = Math.min(1, Math.max(stop2, params.stop3))
    const at = [0, n === 2 ? 1 : stop2, n === 4 ? stop3 : 1, 1].slice(0, n)
    const stops = colors.slice(0, n).map((color, i) => `${formatOklch({ ...color, alpha: opacity })} ${+(at[i]! * 100).toFixed(2)}%`)
    return [`linear-gradient(in ${space} ${params.angle}deg, ${stops.join(', ')})`]
  },
})
