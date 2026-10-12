/**
 * The shared WGSL noise library. Generators list the modules they use in `requires`; the composer
 * includes each one (and its dependencies) once per shader. Every symbol is prefixed `noise_`.
 *
 * Hashing is integer PCG (Jarzynski & Olano 2020) rather than `fract(sin(…))`, so patterns are
 * identical on every GPU and don't band at large coordinates.
 */
export const NOISE = {
  /** `noise_hash22(p) -> vec2f` and `noise_hash21(p) -> f32`, uniform in [0, 1). */
  hash: {
    requires: [],
    wgsl: /* wgsl */ `
fn noise_pcg2(v0: vec2u) -> vec2u {
  var v = v0 * 1664525u + 1013904223u;
  v.x += v.y * 1664525u; v.y += v.x * 1664525u;
  v = v ^ (v >> vec2u(16u));
  v.x += v.y * 1664525u; v.y += v.x * 1664525u;
  return v ^ (v >> vec2u(16u));
}
// The top 24 bits convert to f32 exactly, so the result is uniform in [0, 1) and never rounds up to 1.
fn noise_hash22(p: vec2f) -> vec2f { return vec2f(noise_pcg2(bitcast<vec2u>(vec2i(floor(p)))) >> vec2u(8u)) * (1.0 / 16777216.0); }
fn noise_hash21(p: vec2f) -> f32 { return noise_hash22(p).x; }
`,
  },
  /** `noise_value(p) -> f32`: smooth value noise in [0, 1]. */
  value: {
    requires: ['hash'],
    wgsl: /* wgsl */ `
fn noise_value(p: vec2f) -> f32 {
  let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(noise_hash21(i), noise_hash21(i + vec2f(1.0, 0.0)), u.x),
             mix(noise_hash21(i + vec2f(0.0, 1.0)), noise_hash21(i + vec2f(1.0, 1.0)), u.x), u.y);
}
`,
  },
  /** `noise_perlin(p) -> f32`: gradient noise in about [-1, 1], quintic fade. */
  perlin: {
    requires: ['hash'],
    wgsl: /* wgsl */ `
fn noise_grad(i: vec2f, f: vec2f) -> f32 {
  let a = noise_hash21(i) * 6.2831853;
  return dot(vec2f(cos(a), sin(a)), f);
}
fn noise_perlin(p: vec2f) -> f32 {
  let i = floor(p); let f = fract(p);
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return 1.4142 * mix(mix(noise_grad(i, f), noise_grad(i + vec2f(1.0, 0.0), f - vec2f(1.0, 0.0)), u.x),
                      mix(noise_grad(i + vec2f(0.0, 1.0), f - vec2f(0.0, 1.0)), noise_grad(i + vec2f(1.0, 1.0), f - vec2f(1.0, 1.0)), u.x), u.y);
}
`,
  },
  /** `noise_simplex(p) -> f32`: 2D simplex noise in about [-1, 1] (after Gustavson and McEwan). */
  simplex: {
    requires: ['hash'],
    wgsl: /* wgsl */ `
fn noise_simplex(v: vec2f) -> f32 {
  let C = vec4f(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  let i = floor(v + dot(v, C.yy));
  let x0 = v - i + dot(i, C.xx);
  let o = select(vec2f(0.0, 1.0), vec2f(1.0, 0.0), x0.x > x0.y);
  let x1 = x0 + C.xx - o;
  let x2 = x0 + C.zz;
  let g0 = noise_hash21(i) * 6.2831853;
  let g1 = noise_hash21(i + o) * 6.2831853;
  let g2 = noise_hash21(i + 1.0) * 6.2831853;
  var m = max(vec3f(0.5) - vec3f(dot(x0, x0), dot(x1, x1), dot(x2, x2)), vec3f(0.0));
  m = m * m; m = m * m;
  let g = vec3f(dot(vec2f(cos(g0), sin(g0)), x0), dot(vec2f(cos(g1), sin(g1)), x1), dot(vec2f(cos(g2), sin(g2)), x2));
  return 99.0 * dot(m, g);
}
`,
  },
  /** `noise_worley(p) -> vec2f`: cellular noise, distances to the nearest and second-nearest points. */
  worley: {
    requires: ['hash'],
    wgsl: /* wgsl */ `
fn noise_worley(p: vec2f) -> vec2f {
  let i = floor(p); let f = fract(p);
  var d = vec2f(8.0);
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let o = vec2f(f32(x), f32(y));
      let r = length(o + noise_hash22(i + o) - f);
      if (r < d.x) { d = vec2f(r, d.x); } else if (r < d.y) { d.y = r; }
    }
  }
  return d;
}
`,
  },
  /** `noise_fbm(p, octaves)`: simplex fbm in about [-1, 1]; `noise_ridged` in [0, 1]; `noise_turbulence` in [0, 1]. */
  fbm: {
    requires: ['simplex'],
    wgsl: /* wgsl */ `
const NOISE_ROTATE = mat2x2f(0.8, 0.6, -0.6, 0.8);
fn noise_fbm(p0: vec2f, octaves: i32) -> f32 {
  var p = p0; var v = 0.0; var a = 0.5; var n = 0.0;
  for (var k = 0; k < octaves; k++) { v += a * noise_simplex(p); n += a; p = NOISE_ROTATE * p * 2.02; a *= 0.5; }
  return v / n;
}
fn noise_ridged(p0: vec2f, octaves: i32) -> f32 {
  var p = p0; var v = 0.0; var a = 0.5; var n = 0.0; var prev = 1.0;
  for (var k = 0; k < octaves; k++) {
    let r = 1.0 - abs(noise_simplex(p));
    let s = r * r * prev;
    v += a * s; n += a; prev = s; p = NOISE_ROTATE * p * 2.02; a *= 0.5;
  }
  return v / n;
}
fn noise_turbulence(p0: vec2f, octaves: i32) -> f32 {
  var p = p0; var v = 0.0; var a = 0.5; var n = 0.0;
  for (var k = 0; k < octaves; k++) { v += a * abs(noise_simplex(p)); n += a; p = NOISE_ROTATE * p * 2.02; a *= 0.5; }
  return v / n;
}
`,
  },
  /** `noise_curl(p) -> vec2f`: a divergence-free flow field from the gradient of simplex fbm. */
  curl: {
    requires: ['fbm'],
    wgsl: /* wgsl */ `
fn noise_curl(p: vec2f) -> vec2f {
  let e = 0.01;
  let dx = noise_fbm(p + vec2f(e, 0.0), 3) - noise_fbm(p - vec2f(e, 0.0), 3);
  let dy = noise_fbm(p + vec2f(0.0, e), 3) - noise_fbm(p - vec2f(0.0, e), 3);
  return vec2f(dy, -dx) / (2.0 * e);
}
`,
  },
} as const satisfies Record<string, { requires: readonly string[], wgsl: string }>

export type NoiseModule = keyof typeof NOISE

/** WGSL for the given modules and everything they depend on, each once, dependencies first. */
export function noiseWgsl(modules: Iterable<NoiseModule>): string {
  const done = new Set<NoiseModule>()
  const out: string[] = []
  const visit = (name: NoiseModule) => {
    if (done.has(name)) return
    done.add(name)
    for (const dep of NOISE[name].requires as readonly NoiseModule[]) visit(dep)
    out.push(NOISE[name].wgsl)
  }
  for (const name of modules) visit(name)
  return out.join('')
}
