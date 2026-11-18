/** Optional scene modifiers. No extra textures or render passes. */
export function modifiersWgsl(slot: number | undefined, pixelate: number | undefined, dof: number | undefined): string {
  const sample = dof === undefined ? '_aurora_scene_sample' : '_aurora_dof_render'
  return /* wgsl */ `
fn _aurora_scene_sample(uv: vec2f) -> vec4f {
let p = clamp(${pixelate === undefined ? 'uv' : `mix(uv, (floor(uv * U.v[0].xy / U.v[${pixelate}].x) + 0.5) * U.v[${pixelate}].x / U.v[0].xy, select(1.0, 0.0, U.v[${pixelate}].x == 1.0))`}, vec2f(0.0), vec2f(1.0));
var ctx = Ctx(p, U.v[0].xy${pixelate === undefined ? '' : ` / U.v[${pixelate}].x`}, U.v[0].z, U.v[0].w);
return _aurora_scene(ctx, (p - U.v[1].xy) / U.v[1].zw, (ctx.res.x * U.v[1].z) / (ctx.res.y * U.v[1].w));
}
${dof === undefined
  ? ''
  : `fn _aurora_dof_render(uv: vec2f) -> vec4f {
let d = U.v[${dof}];
let r = d.x * smoothstep(0.0, max(0.02, 1.0 - d.z * 0.85), abs(uv.y - d.y)) * 0.036;
var c = _aurora_scene_sample(uv);
if (r * min(U.v[0].x, U.v[0].y) < 0.5) { return c; }
let s = vec2f(min(U.v[0].x, U.v[0].y)) / U.v[0].xy * r;
var w = 1.0;
for (var i = 1; i <= 10; i++) {
let f = f32(i);
let p = _aurora_scene_sample(uv + vec2f(cos(f * 2.4), sin(f * 2.4)) * sqrt(f * 0.1) * s);
let k = 1.0 + dot(p.rgb, p.rgb) * 1.8;
c += p * k;
w += k;
}
return c / w;
}`}
${slot === undefined
  ? ''
  : `fn _aurora_signal_render(uv: vec2f) -> vec4f {
let a = U.v[${slot}];
let b = U.v[${slot + 1}];
if (a.x == 0.0) { return ${sample}(uv); }
let clock = U.v[0].z * b.y;
let cycle = floor(clock);
let phase = fract(clock);
let ev = noise_hash22(vec2f(cycle, b.z + 37.0));
let st = 0.08 + ev.x * 0.12;
let burst = smoothstep(st, st + 0.035, phase) * (1.0 - smoothstep(st + 0.16, st + 0.28, phase));
let jit = noise_hash22(vec2f(floor(clock * 48.0), b.z + 83.0)) - 0.5;
let h = max(a.z * (0.65 + ev.y * 0.7), 4.0 / U.v[0].y);
let loc = fract(uv.y / h);
let cov = smoothstep(0.0, 1.0 / U.v[0].y, min(loc, 1.0 - loc) * h);
let band = noise_hash22(vec2f(floor(uv.y / h) + b.z, cycle));
let p = vec2f((uv.x - 0.5) * (1.0 + a.x * burst * (band.y - 0.5) * 0.65) + 0.5 + a.x * ((band.x - 0.5) * (0.035 + burst * 0.3) * cov + jit.x * a.y * burst * 0.08), uv.y + jit.y * b.x * a.x * burst * 0.12);
let c0 = ${sample}(p);
let sp = a.w * a.x * burst * 0.017 * cov;
if (sp * U.v[0].x < 0.5) { return c0; }
let l = ${sample}(p - vec2f(sp, 0.0));
let r = ${sample}(p + vec2f(sp, 0.0));
return vec4f(l.r, c0.g, r.b, max(l.a, max(c0.a, r.a)));
}`}
`
}
