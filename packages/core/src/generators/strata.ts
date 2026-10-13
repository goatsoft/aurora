import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Earth: flowing sandstone strata, like canyon walls carved by wind. Folded sediment bands, each
 * its own shade of the palette, with fine bedding lines inside and a slow geological drift.
 */
export const strata = defineGenerator({
  id: 'strata',
  label: 'Strata',
  description: 'Earth: folded sandstone layers that drift slowly.',
  colors: 3,
  palette: ['oklch(0.46 0.11 34)', 'oklch(0.67 0.13 50)', 'oklch(0.9 0.05 78)'],
  requires: ['fbm', 'hash'],
  params: {
    bands: { default: 9, min: 2, max: 30, step: 0.5, label: 'Bands', description: 'Number of sediment layers across the canvas.' },
    fold: { default: 0.32, min: 0, max: 2.5, step: 0.01, label: 'Fold', description: 'How much the layers bend and swirl.' },
    detail: { default: 0.35, min: 0, max: 1, step: 0.01, label: 'Detail', description: 'Fine bedding lines inside each layer.' },
    angle: { default: -12, min: -90, max: 90, step: 1, label: 'Angle', description: 'Tilt of the layers.', unit: 'deg' },
    speed: { default: 0.02, min: 0, max: 0.3, step: 0.005, label: 'Speed', description: 'Geological drift: how fast the layers flow.' },
    scale: { default: 1, min: 0.3, max: 4, step: 0.05, label: 'Scale', description: 'Higher gives smaller, tighter folds.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different rock face.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn ramp(c: array<vec3f, 3>, k: f32) -> vec3f {
  return select(mix(c[1], c[2], k * 2.0 - 1.0), mix(c[0], c[1], k * 2.0), k < 0.5);
}
// The layer coordinate: rock height across the bands, bent by a broad fold and a finer ripple.
fn layers(p: vec2f, t: f32, P: Params) -> f32 {
  let fold = noise_fbm(p * 0.45 + vec2f(t, t * 0.4), 3) * P.fold + noise_fbm(p * 1.4 - vec2f(t * 0.6, 0.0), 3) * P.fold * 0.18;
  return (p.y + fold) * P.bands;
}
// Wind-carved relief: each layer is a terrace whose hard upper lip erodes into a softer slope.
fn relief(v: f32) -> f32 {
  let f = fract(v);
  return floor(v) + smoothstep(0.7, 1.0, f) * 0.85 + f * 0.15;
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let a = radians(P.angle);
  let rot = mat2x2f(cos(a), sin(a), -sin(a), cos(a));
  let p = rot * (vec2f((ctx.uv.x - 0.5) * aspect, ctx.uv.y - 0.5)) * P.scale + P.seed * 2.9;
  let t = ctx.time * P.speed;
  // One pixel, in pattern units: the step for the relief gradient and the band-limit for fine detail.
  let px = P.scale / ctx.res.y;
  let v = layers(p, t, P);
  let vx = layers(p + vec2f(px, 0.0), t, P);
  let vy = layers(p + vec2f(0.0, px), t, P);
  let dv = max(length(vec2f(vx - v, vy - v)), 1e-5);
  let index = floor(v);
  let f = fract(v);
  // Each layer takes its own shade; edges blend into the next over at least a pixel and a half.
  let here = noise_hash21(vec2f(index, P.seed));
  let next = noise_hash21(vec2f(index + 1.0, P.seed));
  let k = mix(here, next, smoothstep(1.0 - max(0.18, dv * 1.5), 1.0, f));
  var col = ramp(c, k);
  // Bedding lines inside the layer, wavering with the rock, faded out before they alias.
  let lines = 1.0 - smoothstep(0.2, 0.45, dv * 6.0);
  let bed = sin((v * 6.0 + noise_fbm(p * 5.0, 2) * 1.5) * 6.2831853) * 0.5 + 0.5;
  col *= 1.0 - P.detail * 0.12 * bed * lines;
  // Sunlight from the upper left across the carved terraces.
  let h = relief(v);
  // The slope per layer, so the light doesn't depend on resolution; it fades where layers are a few pixels wide.
  let slope = vec2f(relief(vx) - h, relief(vy) - h) / dv * (1.0 - smoothstep(0.12, 0.35, dv));
  let n = normalize(vec3f(-slope * 0.45, 1.0));
  let sun = normalize(vec3f(-0.5, -0.6, 0.62));
  col *= 0.82 + 0.3 * dot(n, sun);
  return vec4f(col, 1.0);
}
`,
  css: ({ colors, params, opacity }) => {
    const [rust, clay, sand] = colors.map((color) => formatOklch({ ...color, alpha: opacity }))
    const angle = 180 + params.angle
    return [`repeating-linear-gradient(in oklab ${angle}deg, ${clay!} 0 8%, ${sand!} 11% 17%, ${rust!} 21% 27%, ${clay!} 31%)`]
  },
})
