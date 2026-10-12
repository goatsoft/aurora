import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Air: billowing clouds drifting across an open sky. Two depths of fbm cloud, each lit by a sun
 * above: a short march towards the sun darkens the thick bellies and leaves the tops and edges
 * bright, so the clouds read as volumes rather than blobs.
 */
export const clouds = defineGenerator({
  id: 'clouds',
  label: 'Clouds',
  description: 'Air: soft, sunlit clouds drifting across an open sky.',
  colors: 3,
  palette: ['oklch(0.58 0.13 248)', 'oklch(0.7 0.05 255)', 'oklch(0.99 0.01 85)'],
  requires: ['fbm'],
  params: {
    coverage: { default: 0.42, min: 0, max: 1, step: 0.01, label: 'Coverage', description: 'How much of the sky the clouds fill.' },
    softness: { default: 0.45, min: 0.05, max: 1, step: 0.01, label: 'Softness', description: 'Wispy, feathered edges or crisp, puffy ones.' },
    light: { default: 0.7, min: 0, max: 1, step: 0.01, label: 'Light', description: 'How strongly the sun shades the clouds.' },
    angle: { default: 90, min: 0, max: 360, step: 1, label: 'Angle', description: 'Direction the clouds drift, CSS convention (90 = left to right).', unit: 'deg' },
    speed: { default: 0.5, min: 0, max: 4, step: 0.01, label: 'Speed', description: 'How fast the clouds drift.' },
    scale: { default: 0.85, min: 0.3, max: 4, step: 0.05, label: 'Scale', description: 'Size of the clouds.' },
    sky: { default: 1, min: 0, max: 1, step: 0.01, label: 'Sky', description: 'Opacity of the sky behind the clouds; 0 for clouds alone.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different sky.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
// Raw cloud field: broad billows from low octaves, gently warped, with finer octaves eroding the edges.
fn field(p: vec2f, t: f32) -> f32 {
  let warp = vec2f(noise_fbm(p * 0.35 + vec2f(t * 0.03, 1.7), 2), noise_fbm(p * 0.35 + vec2f(4.3, -t * 0.03), 2));
  return noise_fbm(p + warp * 0.35, 6) * 0.5 + 0.5;
}
// One depth of cloud: coverage and how much sunlight reaches it, from a short march towards the sun.
fn layer(p: vec2f, t: f32, absorb: f32, P: Params) -> vec2f {
  let edge = mix(0.68, 0.34, P.coverage);
  let n = field(p, t);
  let d = smoothstep(edge, edge + mix(0.03, 0.4, P.softness * P.softness), n);
  let sun = vec2f(0.012, -0.045);
  var depth = 0.0;
  for (var i = 1; i <= 3; i++) { depth += max(field(p + sun * f32(i * i), t) - edge, 0.0); }
  return vec2f(d, exp(-depth * absorb * P.light));
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let a = radians(P.angle);
  let drift = vec2f(sin(a), -cos(a)) * ctx.time * P.speed * 0.05;
  let base = vec2f(ctx.uv.x * aspect, ctx.uv.y * 1.25) * 1.3 * P.scale + P.seed * 3.1;
  // Sky: deep overhead, paler towards the horizon.
  var col = mix(c[0], mix(c[0], c[2], 0.5), smoothstep(0.0, 1.1, ctx.uv.y));
  var alpha = P.sky;
  // Far clouds are smaller, slower and hazier; near ones pass in front.
  for (var i = 0; i < 2; i++) {
    let k = f32(i);
    let s = layer(base * (1.8 - k * 0.8) - drift * (0.5 + k * 0.5) + k * 9.0, ctx.time * P.speed, 3.5 + 3.5 * k, P);
    // Shadowed bellies take the shadow colour; sunlit tops and thin edges glow.
    let lit = mix(c[1], c[2], 0.12 + 0.88 * s.y);
    // Far clouds sink into the sky's haze.
    let cloud = mix(lit, col, 0.4 * (1.0 - k) * P.sky);
    let w = s.x * (0.85 + 0.15 * k);
    col = mix(col, cloud, w / max(alpha + w * (1.0 - alpha), 1e-4));
    alpha = alpha + w * (1.0 - alpha);
  }
  return vec4f(col, alpha);
}
`,
  css: ({ colors, params, opacity }) => {
    const [sky, shadow, light] = colors
    const cloud = (alpha: number) => formatOklch({ ...light!, alpha: alpha * opacity })
    return [
      `radial-gradient(28% 16% at 22% 30%, ${cloud(0.85)}, transparent)`,
      `radial-gradient(34% 18% at 68% 22%, ${cloud(0.75)}, transparent)`,
      `radial-gradient(30% 14% at 48% 62%, ${formatOklch({ ...shadow!, alpha: 0.6 * opacity })}, transparent)`,
      `linear-gradient(in oklab to bottom, ${formatOklch({ ...sky!, alpha: params.sky * opacity })}, ${formatOklch({ ...light!, alpha: params.sky * opacity * 0.6 })})`,
    ]
  },
})
