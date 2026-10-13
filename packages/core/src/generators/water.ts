import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Water: sunlight caustics dancing over depth-shaded water. Two drifting, wobbling cellular layers;
 * the bright web is where their cell edges meet (an original take, not the Shadertoy classic).
 */
export const water = defineGenerator({
  id: 'water',
  label: 'Water',
  description: 'Water: moving light patterns on the floor of clear water.',
  colors: 3,
  palette: ['oklch(0.3 0.08 245)', 'oklch(0.55 0.12 220)', 'oklch(0.95 0.07 185)'],
  requires: ['worley', 'simplex'],
  params: {
    scale: { default: 3, min: 0.5, max: 10, step: 0.05, label: 'Scale', description: 'Higher gives smaller light cells; lower gives larger ones.' },
    speed: { default: 0.28, min: 0, max: 2, step: 0.01, label: 'Speed', description: 'How fast the light ripples.' },
    caustics: { default: 0.85, min: 0, max: 2, step: 0.01, label: 'Caustics', description: 'Brightness of the light web.' },
    sharpness: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Sharpness', description: 'Higher gives thin, crisp lines; lower gives broad, soft light.' },
    wobble: { default: 0.35, min: 0, max: 1, step: 0.01, label: 'Wobble', description: 'How much the surface distorts the light.' },
    depth: { default: 0.6, min: 0, max: 1, step: 0.01, label: 'Depth', description: 'How much darker the water gets towards the bottom.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different surface.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn web(p: vec2f, width: f32) -> f32 {
  let f = noise_worley(p);
  return 1.0 - smoothstep(0.0, width, f.y - f.x);
}
// The surface: two layers scrolling against each other, so it shimmers in place instead of sliding.
fn surface(p: vec2f, t: f32) -> vec2f {
  let a = vec2f(noise_simplex(p + vec2f(t * 0.6, t * 0.5)), noise_simplex(p + vec2f(5.2, 1.3) - vec2f(t * 0.5, t * 0.7)));
  let b = vec2f(noise_simplex(p * 1.7 - vec2f(t * 0.55, t * 0.4) + 9.1), noise_simplex(p * 1.7 + vec2f(t * 0.45, t * 0.6) + 3.7));
  return a + b * 0.5;
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let t = ctx.time * P.speed;
  let p = vec2f(ctx.uv.x * aspect, ctx.uv.y) * P.scale + P.seed * 4.7;
  let wob = surface(p * 0.6, t) * P.wobble * 0.4;
  // Lines never get thinner than about a pixel and a half, so they don't shimmer on small canvases.
  let width = max(mix(0.35, 0.06, P.sharpness), 1.5 * P.scale / ctx.res.y);
  let a = web(p + wob + vec2f(t * 0.35, t * 0.2), width);
  let b = web(p * 1.37 - wob * 0.8 + vec2f(-t * 0.25, t * 0.3) + 17.0, width * 1.2);
  let light = clamp(pow(a * 0.6 + b * 0.55, 1.6) * P.caustics, 0.0, 1.0);
  // Depth: lighter near the surface (top), deeper below, with a soft swell of light where the surface lenses it.
  let swell = (wob.x + wob.y) * 0.18;
  let water = mix(c[1], c[0], clamp(smoothstep(0.0, 1.0, ctx.uv.y) * P.depth + (1.0 - P.depth) * 0.35 - swell, 0.0, 1.0));
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
