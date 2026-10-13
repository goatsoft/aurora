import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Domain-warped fbm on value noise: the original aurora shader, bit-for-bit.
 * 4 octaves, rotation (0.8, 0.6, -0.6, 0.8), lacunarity 2.02, gain 0.5; a band and a glow from the field.
 */
export const auroraFbm = defineGenerator({
  id: 'aurora-fbm',
  label: 'Aurora',
  description: 'Drifting ribbons of light.',
  colors: 3,
  palette: ['oklch(0.68 0.16 245)', 'oklch(0.56 0.22 285)', 'oklch(0.58 0.25 310)'],
  params: {
    intensity: { default: 1, min: 0, max: 2, step: 0.01, label: 'Intensity', description: 'How strongly the ribbons show. Above 1 the brightest parts saturate.' },
    scale: { default: 1.6, min: 0.1, max: 5, step: 0.01, label: 'Scale', description: 'Higher gives smaller, busier ribbons; lower gives broader ones.' },
    speed: { default: 0.06, min: 0, max: 1, step: 0.005, label: 'Speed', description: 'How fast the field drifts.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'Offsets the field so neighbours look different.', ui: 'seed' },
    stretch: { default: 0.55, min: 0.05, max: 3, step: 0.01, label: 'Stretch', description: 'Lower gives longer, wispier ribbons; higher gives shorter ones.' },
    sweep: { default: 0, min: 0, max: 1, step: 0.01, label: 'Sweep', description: 'Blend toward a left-to-right gradient from the first to the last colour.' },
  },
  wgsl: /* wgsl */ `
fn hash(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123); }
fn noise(p: vec2f) -> f32 {
  let i = floor(p); let f = fract(p); let w = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2f(1.0, 0.0)), w.x), mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), w.x), w.y);
}
fn fbm(p0: vec2f) -> f32 {
  var p = p0; var v = 0.0; var a = 0.5;
  let m = mat2x2f(0.8, 0.6, -0.6, 0.8);
  for (var k = 0; k < 4; k++) { v += a * noise(p); p = m * p * 2.02; a *= 0.5; }
  return v;
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let uv = ctx.uv;
  let aspect = ctx.res.x / ctx.res.y;
  let p = (vec2f(uv.x * aspect * P.stretch, (uv.y + ctx.scroll) * 1.35) + vec2f(P.seed)) * P.scale;
  let t = ctx.time * P.speed;
  let q = vec2f(fbm(p + vec2f(0.0, t * 0.35)), fbm(p + vec2f(5.2, 1.3) - t * 0.25));
  let r = vec2f(fbm(p + 2.2 * q + vec2f(1.7, 9.2) + t * 0.15), fbm(p + 2.2 * q + vec2f(8.3, 2.8) - t * 0.12));
  let f = fbm(p + 2.4 * r);
  let band = smoothstep(0.48, 0.66, f) * (1.0 - smoothstep(0.66, 0.9, f));
  let glow = pow(f, 4.0);
  let a = clamp(band * 0.7 + glow * 0.3, 0.0, 1.0) * P.intensity;
  var col = mix(mix(c[0], c[1], clamp(r.x * 1.4, 0.0, 1.0)), c[2], clamp(q.y * 1.2, 0.0, 1.0));
  col = mix(col, mix(c[0], c[2], smoothstep(0.0, 1.0, uv.x)) * (0.85 + 0.3 * r.x), P.sweep);
  return vec4f(col, a);
}
`,
  // The original fallback: three soft radial clouds at 0.28 × intensity.
  css: ({ colors, params, space, opacity }) => {
    const alpha = 0.28 * params.intensity * opacity
    const [a, b, c] = colors.map((color) => formatOklch({ ...color, alpha: Math.min(1, alpha) }))
    return [
      `radial-gradient(60% 40% at 20% 30% in ${space}, ${a!}, transparent 70%)`,
      `radial-gradient(50% 45% at 75% 60% in ${space}, ${b!}, transparent 70%)`,
      `radial-gradient(70% 35% at 50% 90% in ${space}, ${c!}, transparent 70%)`,
    ]
  },
})
