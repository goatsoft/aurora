/** Optional scene-space distortion. No extra textures or render passes. */
export function signalWgsl(slot: number | undefined, pixelate: number | undefined): string {
  return /* wgsl */ `
fn _aurora_signal_sample(uv: vec2f) -> vec4f {
  let p = clamp(${pixelate === undefined ? 'uv' : `mix(uv, (floor(uv * U.v[0].xy / U.v[${pixelate}].x) + 0.5) * U.v[${pixelate}].x / U.v[0].xy, select(1.0, 0.0, U.v[${pixelate}].x == 1.0))`}, vec2f(0.0), vec2f(1.0));
  var ctx: Ctx;
  ctx.uv = p;
  ctx.res = U.v[0].xy${pixelate === undefined ? '' : ` / U.v[${pixelate}].x`};
  ctx.time = U.v[0].z;
  ctx.scroll = U.v[0].w;
  let suv = (p - U.v[1].xy) / U.v[1].zw;
  let aspect = (ctx.res.x * U.v[1].z) / (ctx.res.y * U.v[1].w);
  return _aurora_signal_scene(ctx, suv, aspect);
}
${slot === undefined
  ? ''
  : `fn _aurora_signal_render(uv: vec2f) -> vec4f {
  let a = U.v[${slot}];
  let b = U.v[${slot + 1}];
  if (a.x == 0.0) { return _aurora_signal_sample(uv); }
  let clock = U.v[0].z * b.y;
  let cycle = floor(clock);
  let phase = fract(clock);
  let event = noise_hash22(vec2f(cycle, b.z + 37.0));
  let start = 0.08 + event.x * 0.12;
  let burst = smoothstep(start, start + 0.035, phase) * (1.0 - smoothstep(start + 0.16, start + 0.28, phase));
  let tick = floor(clock * 48.0);
  let jitter = noise_hash22(vec2f(tick, b.z + 83.0)) - 0.5;
  let height = max(a.z * (0.65 + event.y * 0.7), 4.0 / U.v[0].y);
  let row = floor(uv.y / height);
  let local = fract(uv.y / height);
  let edge = min(local, 1.0 - local) * height;
  let coverage = smoothstep(0.0, 1.0 / U.v[0].y, edge);
  let band = noise_hash22(vec2f(row + b.z, cycle));
  let tear = (band.x - 0.5) * (0.035 + burst * 0.3) * coverage;
  let grow = 1.0 + a.x * burst * (band.y - 0.5) * 0.65;
  let x = (uv.x - 0.5) * grow + 0.5 + a.x * (tear + jitter.x * a.y * burst * 0.08);
  let y = uv.y + jitter.y * b.x * a.x * burst * 0.12;
  let p = vec2f(x, y);
  let center = _aurora_signal_sample(p);
  let split = a.w * a.x * (0.001 + burst * 0.016) * coverage;
  if (split == 0.0) { return center; }
  let left = _aurora_signal_sample(p - vec2f(split, 0.0));
  let right = _aurora_signal_sample(p + vec2f(split, 0.0));
  return vec4f(left.r, center.g, right.b, max(left.a, max(center.a, right.a)));
}`}
`
}
