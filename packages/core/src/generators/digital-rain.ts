import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** Original segmented glyphs, with independently timed columns and pixel-aware strokes. */
export const digitalRain = defineGenerator({
  id: 'digital-rain',
  label: 'Digital rain',
  description: 'Tech: luminous glyphs falling in uneven columns, with bright heads and fading trails.',
  colors: 3,
  palette: ['oklch(0.12 0.025 165)', 'oklch(0.7 0.17 155)', 'oklch(0.95 0.055 155)'],
  requires: ['hash'],
  params: {
    density: { default: 20, min: 8, max: 64, step: 1, label: 'Density', description: 'Columns per canvas height.' },
    speed: { default: 0.22, min: 0, max: 2, step: 0.01, label: 'Speed', description: 'How quickly the heads fall.' },
    trail: { default: 0.45, min: 0.1, max: 0.9, step: 0.01, label: 'Trail', description: 'Length of each fading trail.' },
    rate: { default: 2, min: 0, max: 12, step: 0.1, label: 'Change rate', description: 'Glyph changes per second; 0 keeps the symbols fixed.', unit: '/s' },
    glow: { default: 0.25, min: 0, max: 1, step: 0.01, label: 'Glow', description: 'Soft light surrounding each column.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'Different glyphs and column timings.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let density = min(P.density, ctx.res.y / 9.0);
  let q = ctx.uv * vec2f(ctx.res.x / ctx.res.y, 1.0) * density;
  let cell = floor(q);
  let local = fract(q);
  let h = noise_hash22(vec2f(cell.x, P.seed * 13.0));
  let head = fract(h.x + ctx.time * P.speed * (0.3 + h.y * 0.5));
  let behind = fract(head - (cell.y + 0.5) / density);
  let tail = pow(max(0.0, 1.0 - behind / P.trail), 1.4);
  let lead = 1.0 - smoothstep(0.0, 1.5 / density, behind);
  let glyph = floor(noise_hash21(cell + vec2f(P.seed * 31.0, floor(ctx.time * P.rate))) * 65535.0);
  let p = (local - 0.5) * vec2f(1.15, 1.0);
  let pixel = density / ctx.res.y;
  var ink = 0.0;
  for (var i = 0u; i < 7u; i++) {
    let fi = f32(i);
    let horizontal = i < 3u;
    let center = select(vec2f(select(-0.23, 0.23, i > 4u), select(-0.2, 0.2, (i & 1u) == 0u)), vec2f(0.0, (fi - 1.0) * 0.34), horizontal);
    let halfSize = select(vec2f(0.035, 0.16), vec2f(0.25, 0.035), horizontal);
    let d = abs(p - center) - halfSize;
    let stroke = 1.0 - smoothstep(-pixel * 0.4, pixel * 0.7, max(d.x, d.y));
    ink = max(ink, stroke * f32((u32(glyph) >> i) & 1u));
  }
  let halo = exp(-18.0 * p.x * p.x) * tail * P.glow * 0.12;
  let intensity = clamp(ink * tail * (0.6 + 0.4 * h.y) + halo, 0.0, 1.0);
  return vec4f(mix(c[0], mix(c[1], c[2], lead), intensity), 1.0);
}
`,
  css: ({ colors, space, opacity }) => {
    const base = formatOklch({ ...colors[0]!, alpha: opacity })
    const glow = formatOklch({ ...colors[1]!, alpha: opacity * 0.12 })
    return [`repeating-linear-gradient(in ${space} 90deg, transparent 0 22px, ${glow} 23px 24px, transparent 25px 42px)`, `linear-gradient(${base}, ${base})`]
  },
})
