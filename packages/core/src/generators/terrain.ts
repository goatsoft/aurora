import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** Earth: a slowly shifting topographic map. Ridged, warped fbm becomes strata with crisp contour lines. */
export const terrain = defineGenerator({
  id: 'terrain',
  label: 'Terrain',
  description: 'Earth: drifting strata and contour lines, like a living topographic map.',
  colors: 3,
  palette: ['oklch(0.3 0.04 40)', 'oklch(0.54 0.09 55)', 'oklch(0.82 0.07 85)'],
  requires: ['fbm'],
  params: {
    scale: { default: 0.9, min: 0.3, max: 6, step: 0.05, label: 'Scale', description: 'Zoom of the landscape.' },
    contours: { default: 9, min: 2, max: 40, step: 1, label: 'Contours', description: 'Number of strata from lowest to highest.' },
    lines: { default: 0.55, min: 0, max: 1, step: 0.01, label: 'Lines', description: 'Strength of the contour lines.' },
    warp: { default: 0.45, min: 0, max: 2, step: 0.01, label: 'Warp', description: 'How folded the land is.' },
    speed: { default: 0.025, min: 0, max: 0.5, step: 0.005, label: 'Speed', description: 'How fast the landscape shifts.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different landscape.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let p = vec2f(ctx.uv.x * aspect, ctx.uv.y) * P.scale + P.seed * 3.1;
  let t = ctx.time * P.speed;
  let w = vec2f(noise_fbm(p + vec2f(t, 0.0), 3), noise_fbm(p + vec2f(5.2, t), 3)) * P.warp;
  // Broad hills from fbm, with a little ridged detail on the slopes.
  let h = clamp((noise_fbm(p + w, 5) * 0.5 + 0.5) * 1.15 - 0.08 + (noise_ridged(p * 2.3 + w, 3) - 0.5) * 0.06, 0.0, 1.0);
  let level = h * P.contours;
  // Strata: flat bands, softened so they read as terraces, not posterisation.
  let band = (floor(level) + smoothstep(0.85, 1.0, fract(level))) / P.contours;
  var col = select(mix(c[1], c[2], band * 2.0 - 1.0), mix(c[0], c[1], band * 2.0), band < 0.5);
  // Anti-aliased contour lines at every band edge.
  let edge = min(fract(level), 1.0 - fract(level)) / max(fwidth(level), 1e-4);
  col = mix(col, c[2] * 1.08, P.lines * (1.0 - smoothstep(0.0, 1.2, edge)) * 0.6);
  return vec4f(col, 1.0);
}
`,
  css: ({ colors, opacity }) => {
    const [low, mid, high] = colors.map((color) => formatOklch({ ...color, alpha: opacity }))
    return [
      `radial-gradient(70% 60% at 30% 35% in oklab, ${high!}, transparent 70%)`,
      `radial-gradient(60% 70% at 75% 70% in oklab, ${mid!}, transparent 75%)`,
      `linear-gradient(in oklab 160deg, ${mid!}, ${low!})`,
    ]
  },
})
