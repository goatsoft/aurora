import { formatOklch } from '@goatsoft/color'
import { defineGenerator } from './define'

/**
 * Air: billowing clouds drifting across an open sky. Each cloud is built from round lobes of
 * inverted cellular noise (Perlin-Worley), gathered by a broad fbm and eroded at the edge by a fine
 * one. Two depths, each lit by a short march towards a sun above: where the cloud thins towards the
 * sun its tops and edges glow, and the cloud stacked above darkens the bellies, so they read as
 * volumes. Far clouds are smaller, slower and sink into the sky's haze.
 */
export const clouds = defineGenerator({
  id: 'clouds',
  label: 'Clouds',
  description: 'Air: cumulus clouds at two depths, lit from one side, drifting slowly.',
  colors: 3,
  palette: ['oklch(0.58 0.13 248)', 'oklch(0.7 0.05 255)', 'oklch(0.99 0.01 85)'],
  requires: ['fbm', 'worley'],
  params: {
    coverage: { default: 0.42, min: 0, max: 1, step: 0.01, label: 'Coverage', description: 'Higher fills more of the sky with cloud.' },
    softness: { default: 0.45, min: 0.05, max: 1, step: 0.01, label: 'Softness', description: 'Higher gives wispy, feathered edges; lower gives crisp, puffy ones.' },
    light: { default: 0.7, min: 0, max: 1, step: 0.01, label: 'Light', description: 'Higher gives stronger shading from the sun on one side.' },
    angle: { default: 90, min: 0, max: 360, step: 1, label: 'Angle', description: 'Direction the clouds drift, CSS convention (90 = left to right).', unit: 'deg' },
    speed: { default: 0.5, min: 0, max: 4, step: 0.01, label: 'Speed', description: 'How fast the clouds drift.' },
    scale: { default: 0.85, min: 0.3, max: 4, step: 0.05, label: 'Scale', description: 'Higher gives smaller, more numerous clouds; lower gives fewer, larger ones.' },
    sky: { default: 1, min: 0, max: 1, step: 0.01, label: 'Sky', description: 'Opacity of the sky behind the clouds; 0 for clouds alone.' },
    seed: { default: 0, min: 0, max: 100, step: 1, label: 'Seed', description: 'A different sky.', ui: 'seed' },
  },
  wgsl: /* wgsl */ `
fn billow(p: vec2f, t: f32) -> f32 {
  var v = 0.0;
  var a = 0.55;
  var q = p;
  for (var k = 0; k < 3; k++) {
    v += a * (1.0 - noise_worley(q + vec2f(t * 0.04 * f32(k + 1), 0.0)).x);
    q = q * 2.07 + 3.1;
    a *= 0.45;
  }
  return v;
}
fn field(p: vec2f, t: f32) -> f32 {
  let gather = noise_fbm(p * 0.32 + vec2f(t * 0.02, 0.0), 3) * 0.5 + 0.5;
  return gather * 0.75 + billow(p * 1.5, t) * 0.6 - 0.22;
}
fn layer(p: vec2f, t: f32, absorb: f32, P: Params) -> vec2f {
  let edge = mix(0.68, 0.34, P.coverage);
  let n = field(p, t);
  let d = smoothstep(edge, edge + mix(0.03, 0.4, P.softness * P.softness), n + noise_fbm(p * 6.0, 2) * 0.05);
  let sun = vec2f(0.015, -0.06);
  var depth = 0.0;
  for (var i = 1; i <= 3; i++) {
    let above = field(p + sun * f32(i), t);
    depth += max(above - n, 0.0) / f32(i) + max(above - edge, 0.0) * 0.08;
  }
  return vec2f(d, exp(-depth * absorb * P.light));
}
fn render(ctx: Ctx, P: Params, c: array<vec3f, 3>) -> vec4f {
  let aspect = ctx.res.x / ctx.res.y;
  let a = radians(P.angle);
  let drift = vec2f(sin(a), -cos(a)) * ctx.time * P.speed * 0.05;
  let base = vec2f(ctx.uv.x * aspect, ctx.uv.y * 1.25) * 1.3 * P.scale + P.seed * 3.1;
  var col = mix(c[0], mix(c[0], c[2], 0.5), smoothstep(0.0, 1.1, ctx.uv.y));
  var alpha = P.sky;
  for (var i = 0; i < 2; i++) {
    let k = f32(i);
    let s = layer(base * (1.8 - k * 0.8) - drift * (0.5 + k * 0.5) + k * 9.0, ctx.time * P.speed, 6.0 + 6.0 * k, P);
    let lit = mix(c[1], c[2], 0.12 + 0.88 * s.y);
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
