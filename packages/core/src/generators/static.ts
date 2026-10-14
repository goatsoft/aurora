import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** Pixel-aligned electronic noise with rolling interference and horizontal signal dropout. */
export const staticNoise = defineGenerator({
  id: 'static',
  label: 'Static',
  description: 'Tech: electronic noise, rolling interference bands and pockets of signal dropout.',
  colors: 3,
  palette: ['oklch(0.13 0.025 265)', 'oklch(0.4 0.08 230)', 'oklch(0.8 0.12 195)'],
  requires: ['hash'],
  params: {
    size: { default: 2, min: 1, max: 8, step: 1, label: 'Cell size', description: 'Noise cell size in whole canvas pixels.', unit: 'px' },
    rate: { default: 8, min: 0, max: 30, step: 1, label: 'Rate', description: 'Signal updates per second; 0 freezes the noise and interference.', unit: '/s' },
    contrast: { default: 0.35, min: 0, max: 1, step: 0.01, label: 'Contrast', description: 'Brightness and contrast of the signal noise.' },
    interference: { default: 0.35, min: 0, max: 1, step: 0.01, label: 'Interference', description: 'Strength of the rolling horizontal signal bands.' },
    dropout: { default: 0.25, min: 0, max: 1, step: 0.01, label: 'Dropout', description: 'Amount of dark horizontal signal loss.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'Different signal noise.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let frame = floor(ctx.time * P.rate);
  let cell = floor(ctx.uv * ctx.res / max(1.0, round(P.size)));
  let n = noise_hash21(cell + vec2f(frame * 17.0 + P.seed * 41.0, frame * 31.0));
  let y = ctx.uv.y;
  let band = pow(0.5 + 0.5 * cos((y * 3.0 - frame * 0.006) * 6.2831853), 8.0);
  let row = noise_hash21(vec2f(floor(y * min(60.0, ctx.res.y / 2.0)), floor(frame / 8.0) + P.seed));
  let loss = smoothstep(P.dropout * 0.6, P.dropout * 0.6 + 0.08, row);
  let intensity = clamp((n * n * 0.55 + band * P.interference * n) * P.contrast * loss, 0.0, 1.0);
  let signal = mix(c[1], c[2], band * P.interference);
  return vec4f(mix(c[0], signal, intensity), 1.0);
}
`,
  css: ({ colors, params, space, opacity }) => {
    const base = formatOklch({ ...colors[0]!, alpha: opacity })
    const signal = formatOklch({ ...colors[1]!, alpha: opacity * params.contrast * 0.25 })
    return [`repeating-linear-gradient(in ${space} 0deg, transparent 0 2px, ${signal} 3px 4px)`, `linear-gradient(${base}, ${base})`]
  },
})
