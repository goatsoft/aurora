import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Aurora curtains, the way they hang in the sky: a sharp, bright lower edge that sways, fine
 * vertical rays climbing out of it, and colour that shifts from the edge to the top (green into a
 * red or violet fringe). Up to three folds at different depths. Transparent outside the light, so
 * it sits over a starfield.
 *
 * Farther folds hang a little higher, sway more slowly and glow less. Rays are value noise
 * stretched upright, drifting sideways and climbing over time; a curtain also brightens and fades
 * along its length. `tilt` and `arc` sweep the edge across the sky, and `glow` fills the space
 * between the rays with soft, cloudy light.
 */
export const curtain = defineGenerator({
  id: 'curtain',
  label: 'Curtain',
  description: 'Aurora curtains: a bright, swaying lower edge with rays rising out of it.',
  colors: 3,
  palette: ['oklch(0.88 0.23 150)', 'oklch(0.74 0.18 170)', 'oklch(0.62 0.22 340)'],
  requires: ['fbm', 'value'],
  params: {
    intensity: { default: 1, min: 0, max: 2, step: 0.01, label: 'Intensity', description: 'How bright the curtains glow.' },
    base: { default: 0.62, min: 0.1, max: 1, step: 0.01, label: 'Edge', description: 'Where the lower edge hangs, from the top of the canvas.' },
    height: { default: 0.5, min: 0.1, max: 1, step: 0.01, label: 'Height', description: 'How far the light rises above the edge.' },
    wave: { default: 0.5, min: 0, max: 1, step: 0.01, label: 'Wave', description: 'How much the edge folds and sways.' },
    rays: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Rays', description: 'How strongly the light breaks into vertical rays.' },
    rise: { default: 0.2, min: 0, max: 1, step: 0.01, label: 'Rise', description: 'How fast the rays climb.' },
    speed: { default: 0.12, min: 0, max: 1, step: 0.01, label: 'Sway', description: 'How fast the edge moves.' },
    folds: { default: 2, min: 1, max: 3, step: 1, label: 'Folds', description: 'Curtains one behind another.' },
    tilt: { default: 0, min: -0.6, max: 0.6, step: 0.01, label: 'Tilt', description: 'Raises the edge towards one side, so the curtain sweeps across the sky.' },
    arc: { default: 0, min: -1, max: 1, step: 0.01, label: 'Arc', description: 'Bends the edge: positive curves both ends up, negative bows the middle up.' },
    cover: { default: 0, min: 0, max: 1, step: 0.01, label: 'Cover', description: 'Fills the gaps along the curtain, from separate patches to one band across the sky.' },
    glow: { default: 0.3, min: 0, max: 1, step: 0.01, label: 'Glow', description: 'Soft light between the rays.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different sky.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let x = ctx.uv.x * ctx.res.x / ctx.res.y;
  let t = ctx.time;
  var col = vec3f(0.0);
  var light = 0.0;
  for (var k = 0; k < 3; k++) {
    let f = f32(k);
    if (f >= round(P.folds)) { break; }
    let s = P.seed * 3.17 + f * 11.3;
    let near = 1.0 - f * 0.28;
    let u = ctx.uv.x - 0.5;
    let edge = P.base - f * 0.07 - P.tilt * u - P.arc * 2.0 * u * u + P.wave * 0.24 * noise_fbm(vec2f(x * 1.2 + s, t * P.speed * near + s), 2);
    let d = (edge - ctx.uv.y) / P.height;
    let bend = noise_fbm(vec2f(x * 0.9 + s, t * 0.04 + f), 2) * 0.8;
    let ray = noise_value(vec2f((x + bend) * (14.0 + f * 6.0) + s * 7.0, d * 1.2 - t * P.rise + s));
    let rays = mix(1.0, 0.06 + 1.7 * ray * ray * ray, P.rays);
    let n = noise_value(vec2f(x * 0.9 + s * 1.3, t * P.speed * 0.25 + f * 3.1));
    let along = mix(smoothstep(0.35, 0.8, n), 0.3 + 0.7 * n, P.cover);
    let above = smoothstep(-0.015, 0.0, d) * exp(-max(d, 0.0) * 3.0);
    let rim = exp(-abs(d) * 60.0) * 0.5 * (0.35 + 0.65 * rays);
    let below = exp(min(d, 0.0) * 7.0) * 0.16 * (0.5 + 0.5 * rays);
    let haze = smoothstep(-0.03, 0.02, d) * exp(-max(d, 0.0) * 1.6) * (0.6 + 0.5 * noise_fbm(vec2f(x * 1.1 + s, d * 0.8 - t * 0.03), 3)) * P.glow;
    let i = ((above * rays + rim + haze) * along + below * along) * near;
    let tone = mix(mix(c[0], c[1], smoothstep(0.0, 0.55, d)), c[2], smoothstep(0.45, 1.1, d));
    col += tone * i;
    light += i;
  }
  return vec4f(col / max(light, 1e-4), clamp(light * P.intensity * 0.75, 0.0, 1.0));
}
`,
  // A glowing band at the edge and a softer wash above it.
  css: ({ colors, params, space, opacity }) => {
    const [edge, mid] = colors.map((color, i) => formatOklch({ ...color, alpha: Math.min(1, [0.55, 0.3][i] ?? 0) * params.intensity * opacity }))
    const y = params.base * 100
    return [
      `radial-gradient(75% ${(params.height * 22).toFixed(1)}% at 50% ${y.toFixed(1)}% in ${space}, ${edge!}, transparent 70%)`,
      `radial-gradient(90% ${(params.height * 55).toFixed(1)}% at 50% ${(y - params.height * 30).toFixed(1)}% in ${space}, ${mid!}, transparent 70%)`,
    ]
  },
})
