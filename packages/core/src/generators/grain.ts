import { defineGenerator } from './define'

/** Film grain, regenerated a few times a second. Best as an overlay on top of other layers. */
export const grain = defineGenerator({
  id: 'grain',
  label: 'Grain',
  description: 'Animated film grain, to lay over other layers.',
  colors: 1,
  palette: ['oklch(1 0 0)'],
  requires: ['hash'],
  params: {
    amount: { default: 0.07, min: 0, max: 0.5, step: 0.005, label: 'Amount', description: 'Grain strength.' },
    size: { default: 1, min: 1, max: 6, step: 1, label: 'Size', description: 'Grain size in whole canvas pixels.', unit: 'px' },
    rate: { default: 18, min: 0, max: 30, step: 1, label: 'Rate', description: 'New grain patterns per second; 0 keeps it still.', unit: '/s' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 1>) -> vec4f {
  let frame = floor(ctx.time * P.rate);
  // Whole-pixel cells: a fractional size alternates 1- and 2-pixel cells into a mottled pattern.
  let n = noise_hash21(floor(ctx.uv * ctx.res / max(1.0, round(P.size))) + vec2f(frame * 17.0, frame * 31.0));
  return vec4f(c[0] * n, P.amount);
}
`,
  // Grain has no tasteful CSS equivalent without loading an image, so the fallback leaves it out.
  css: () => [],
})
