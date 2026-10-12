import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Earth: flowing sandstone strata, like canyon walls carved by wind. Folded sediment bands, each
 * its own shade of the palette, with fine bedding lines inside and a slow geological drift.
 */
export const strata = defineGenerator({
  id: 'strata',
  label: 'Strata',
  description: 'Earth: flowing sandstone layers, folded and carved by wind.',
  colors: 3,
  palette: ['oklch(0.46 0.11 34)', 'oklch(0.67 0.13 50)', 'oklch(0.9 0.05 78)'],
  requires: ['fbm', 'hash'],
  params: {
    bands: { default: 9, min: 2, max: 30, step: 0.5, label: 'Bands', description: 'Number of sediment layers across the canvas.' },
    fold: { default: 0.32, min: 0, max: 2.5, step: 0.01, label: 'Fold', description: 'How much the layers bend and swirl.' },
    detail: { default: 0.35, min: 0, max: 1, step: 0.01, label: 'Detail', description: 'Fine bedding lines inside each layer.' },
    angle: { default: -12, min: -90, max: 90, step: 1, label: 'Angle', description: 'Tilt of the layers.', unit: 'deg' },
    speed: { default: 0.02, min: 0, max: 0.3, step: 0.005, label: 'Speed', description: 'Geological drift: how fast the layers flow.' },
    scale: { default: 1, min: 0.3, max: 4, step: 0.05, label: 'Scale', description: 'Size of the folds.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different rock face.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn ramp(c: array<vec3f, 3>, k: f32) -> vec3f {
  return select(mix(c[1], c[2], k * 2.0 - 1.0), mix(c[0], c[1], k * 2.0), k < 0.5);
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let a = radians(P.angle);
  let rot = mat2x2f(cos(a), sin(a), -sin(a), cos(a));
  let p = rot * (vec2f((ctx.uv.x - 0.5) * aspect, ctx.uv.y - 0.5)) * P.scale + P.seed * 2.9;
  let t = ctx.time * P.speed;
  // Folds: a broad bend plus a finer ripple.
  let fold = noise_fbm(p * 0.45 + vec2f(t, t * 0.4), 3) * P.fold + noise_fbm(p * 1.4 - vec2f(t * 0.6, 0.0), 3) * P.fold * 0.18;
  let v = (p.y + fold) * P.bands;
  let index = floor(v);
  let f = fract(v);
  // Each layer takes its own shade; edges blend softly into the next layer.
  let here = noise_hash21(vec2f(index, P.seed));
  let next = noise_hash21(vec2f(index + 1.0, P.seed));
  let k = mix(here, next, smoothstep(0.82, 1.0, f));
  var col = ramp(c, k);
  // Bedding lines inside the layer, wavering with the rock.
  let bed = sin((v * 6.0 + noise_fbm(p * 5.0, 2) * 1.5) * 6.2831853) * 0.5 + 0.5;
  col *= 1.0 - P.detail * 0.12 * bed;
  // A soft relief: each layer is lit a touch brighter at its upper edge.
  col *= 0.9 + 0.14 * smoothstep(0.0, 0.25, f) * (1.0 - smoothstep(0.6, 1.0, f));
  return vec4f(col, 1.0);
}
`,
  css: ({ colors, params, opacity }) => {
    const [rust, clay, sand] = colors.map((color) => formatOklch({ ...color, alpha: opacity }))
    const angle = 180 + params.angle
    return [`repeating-linear-gradient(in oklab ${angle}deg, ${clay!} 0 8%, ${sand!} 11% 17%, ${rust!} 21% 27%, ${clay!} 31%)`]
  },
})
