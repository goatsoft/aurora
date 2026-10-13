import { defineGenerator } from '@/generators/define'

/** Test generator: one flat colour at a given alpha, so blend results can be checked exactly. */
export const solid = defineGenerator({
  id: 'test-solid',
  label: 'Solid',
  description: 'A flat colour.',
  colors: 1,
  params: { alpha: { default: 1, min: 0, max: 1, step: 0.01, label: 'Alpha', description: 'Alpha.' } },
  palette: ['#336699'],
  wgsl: 'fn render(ctx: Ctx, P: Params, c: array<vec3f, 1>) -> vec4f { return vec4f(c[0], P.alpha); }',
  css: ({ colors }) => [`linear-gradient(${colors.length}deg, red, red)`],
})
