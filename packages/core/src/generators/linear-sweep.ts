import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/** The classic animated gradient, done properly: an OKLab ramp that flows along an angle, optionally turning. */
export const linearSweep = defineGenerator({
  id: 'linear-sweep',
  label: 'Linear sweep',
  description: 'A flowing linear gradient through three colours.',
  colors: 3,
  palette: ['oklch(0.55 0.2 275)', 'oklch(0.68 0.22 330)', 'oklch(0.82 0.15 65)'],
  params: {
    angle: { default: 135, min: 0, max: 360, step: 1, label: 'Angle', description: 'Direction of the gradient, CSS convention.', unit: 'deg' },
    spin: { default: 0, min: -90, max: 90, step: 0.5, label: 'Spin', description: 'Turns the gradient over time.', unit: 'deg/s' },
    speed: { default: 0.05, min: 0, max: 1, step: 0.005, label: 'Speed', description: 'How fast the colours flow along the gradient.' },
    scale: { default: 1, min: 0.25, max: 4, step: 0.05, label: 'Scale', description: 'Colour cycles across the canvas.' },
  },
  wgsl: /* wgsl */ `
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let a = radians(P.angle + P.spin * ctx.time);
  let dir = vec2f(sin(a), -cos(a));
  let aspect = ctx.res.x / ctx.res.y;
  let p = (ctx.uv - 0.5) * vec2f(aspect, 1.0);
  let span = abs(dir.x) * aspect + abs(dir.y);
  // A smooth ping-pong 0→1→0 along the gradient, so the flow never jumps.
  let x = fract(dot(p, dir) / span * P.scale + 0.5 - ctx.time * P.speed);
  let s = smoothstep(0.0, 1.0, 1.0 - abs(2.0 * x - 1.0)) * 2.0;
  let col = select(mix(c[1], c[2], s - 1.0), mix(c[0], c[1], s), s < 1.0);
  return vec4f(col, 1.0);
}
`,
  css: ({ colors, params, opacity }) => {
    const [a, b, c] = colors.map((color) => formatOklch({ ...color, alpha: opacity }))
    return [`linear-gradient(in oklab ${params.angle}deg, ${a!}, ${b!}, ${c!}, ${b!}, ${a!})`]
  },
})
