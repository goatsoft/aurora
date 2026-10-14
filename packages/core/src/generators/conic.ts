import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** A turning conic gradient, seamless round the circle, with optional spiral twist and a soft halo. */
export const conic = defineGenerator({
  id: 'conic',
  label: 'Conic',
  description: 'Colours turning around a point.',
  colors: 3,
  palette: ['oklch(0.72 0.17 205)', 'oklch(0.62 0.25 300)', 'oklch(0.8 0.16 80)'],
  params: {
    speed: { default: 0.015, min: -0.5, max: 0.5, step: 0.005, label: 'Speed', description: 'Turns per second.', unit: 'turn/s' },
    twist: { default: 0.35, min: -4, max: 4, step: 0.05, label: 'Twist', description: 'Spirals the colours outwards.' },
    x: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Centre x', description: 'Centre, as a fraction of the width.' },
    y: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Centre y', description: 'Centre, as a fraction of the height.' },
    halo: { default: 0, min: 0, max: 1, step: 0.01, label: 'Halo', description: 'Fades the edges out, leaving a glow around the centre.' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let d = (ctx.uv - vec2f(P.x, P.y)) * vec2f(aspect, 1.0);
  let r = length(d);
  // On the row through the centre -d.y is -0.0, and some GPUs' atan2 then returns the wrong half
  // turn, drawing a line across the whole width. Keep its x argument off zero.
  let ax = select(-d.y, 1e-9, d.y == 0.0);
  let turn = fract(atan2(d.x, ax) / 6.2831853 + P.twist * r - ctx.time * P.speed);
  // Three colours round the circle, back to the first: no seam.
  let s = turn * 3.0;
  let k = smoothstep(0.0, 1.0, fract(s));
  let i = i32(floor(s));
  let col = select(select(mix(c[2], c[0], k), mix(c[1], c[2], k), i == 1), mix(c[0], c[1], k), i == 0);
  let alpha = 1.0 - P.halo * smoothstep(0.05, 0.7, r);
  return vec4f(col, alpha);
}
`,
  css: ({ colors, params, opacity }) => {
    const [a, b, c] = colors.map((color) => formatOklch({ ...color, alpha: opacity }))
    return [`conic-gradient(from 0deg at ${params.x * 100}% ${params.y * 100}% in oklab, ${a!}, ${b!}, ${c!}, ${a!})`]
  },
})
