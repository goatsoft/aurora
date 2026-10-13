/**
 * The original aurora shader behind the classic presets, copied verbatim.
 * It is the parity reference: never edit it to make a test pass.
 */
export const CLASSIC_WGSL = /* wgsl */ `
struct U {
  res: vec2f, time: f32, scroll: f32,
  c0: vec3f, intensity: f32,
  c1: vec3f, scale: f32,
  c2: vec3f, speed: f32,
  fade: f32, seed: f32, stretch: f32, sweep: f32,
};
@group(0) @binding(0) var<uniform> u: U;

struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

@vertex fn vs(@builtin(vertex_index) i: u32) -> VOut {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var o: VOut;
  o.pos = vec4f(p[i], 0.0, 1.0);
  o.uv = p[i] * 0.5 + 0.5;
  return o;
}

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

@fragment fn fs(in: VOut) -> @location(0) vec4f {
  var uv = vec2f(in.uv.x, 1.0 - in.uv.y);
  let aspect = u.res.x / u.res.y;
  let p = (vec2f(uv.x * aspect * u.stretch, (uv.y + u.scroll) * 1.35) + vec2f(u.seed)) * u.scale;
  let t = u.time * u.speed;
  let q = vec2f(fbm(p + vec2f(0.0, t * 0.35)), fbm(p + vec2f(5.2, 1.3) - t * 0.25));
  let r = vec2f(fbm(p + 2.2 * q + vec2f(1.7, 9.2) + t * 0.15), fbm(p + 2.2 * q + vec2f(8.3, 2.8) - t * 0.12));
  let f = fbm(p + 2.4 * r);
  let band = smoothstep(0.48, 0.66, f) * (1.0 - smoothstep(0.66, 0.9, f));
  let glow = pow(f, 4.0);
  let a = clamp(band * 0.7 + glow * 0.3, 0.0, 1.0) * u.intensity;
  var col = mix(mix(u.c0, u.c1, clamp(r.x * 1.4, 0.0, 1.0)), u.c2, clamp(q.y * 1.2, 0.0, 1.0));
  // sweep: force a left→right c0→c2 gradient across the canvas (one cloud, blue to violet)
  col = mix(col, mix(u.c0, u.c2, smoothstep(0.0, 1.0, uv.x)) * (0.85 + 0.3 * r.x), u.sweep);
  var m = 1.0;
  if (u.fade > 0.5) { m = smoothstep(0.0, 0.22, uv.y) * (1.0 - smoothstep(0.78, 1.0, uv.y)); }
  return vec4f(col * a * m, a * m);
}
`
