import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Water: sunlight caustics dancing over depth-shaded water. Two drifting, wobbling cellular layers;
 * the bright web is where their cell edges meet (an original take, not the Shadertoy classic).
 */
export const water = defineGenerator({
  id: 'water',
  label: 'Water',
  description: 'Water: sunlight caustics rippling over deep, clear water.',
  colors: 3,
  palette: ['oklch(0.3 0.08 245)', 'oklch(0.55 0.12 220)', 'oklch(0.95 0.07 185)'],
  requires: ['worley', 'simplex'],
  params: {
    scale: { default: 3, min: 0.5, max: 10, step: 0.05, label: 'Scale', description: 'Size of the caustic cells.' },
    speed: { default: 0.28, min: 0, max: 2, step: 0.01, label: 'Speed', description: 'How fast the light ripples.' },
    caustics: { default: 0.85, min: 0, max: 2, step: 0.01, label: 'Caustics', description: 'Brightness of the light web.' },
    sharpness: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Sharpness', description: 'Thin, crisp lines or broad, soft light.' },
    wobble: { default: 0.35, min: 0, max: 1, step: 0.01, label: 'Wobble', description: 'How much the surface distorts the light.' },
    depth: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Depth', description: 'How much darker the water gets towards the bottom.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different surface.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn web(p: vec2f, width: f32) -> f32 {
  let f = noise_worley(p);
  return 1.0 - smoothstep(0.0, width, f.y - f.x);
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let t = ctx.time * P.speed;
  let p = vec2f(ctx.uv.x * aspect, ctx.uv.y) * P.scale + P.seed * 4.7;
  let wob = vec2f(noise_simplex(p * 0.6 + vec2f(t * 0.7, 0.0)), noise_simplex(p * 0.6 + vec2f(3.3, t * 0.6))) * P.wobble * 0.6;
  let width = mix(0.35, 0.06, P.sharpness);
  let a = web(p + wob + vec2f(t * 0.35, t * 0.2), width);
  let b = web(p * 1.37 - wob * 0.8 + vec2f(-t * 0.25, t * 0.3) + 17.0, width * 1.2);
  let light = clamp(pow(a * 0.6 + b * 0.55, 1.6) * P.caustics, 0.0, 1.0);
  // Depth: lighter near the surface (top), deeper below.
  let water = mix(c[1], c[0], smoothstep(0.0, 1.0, ctx.uv.y) * P.depth + (1.0 - P.depth) * 0.35);
  return vec4f(mix(water, c[2], light), 1.0);
}
`,
  css: ({ colors, opacity }) => {
    const [deep, mid] = colors.map((color) => formatOklch({ ...color, alpha: opacity }))
    return [
      `radial-gradient(40% 30% at 30% 25% in oklab, ${formatOklch({ ...colors[2]!, alpha: 0.35 * opacity })}, transparent)`,
      `linear-gradient(in oklab to bottom, ${mid!}, ${deep!})`,
    ]
  },
})
