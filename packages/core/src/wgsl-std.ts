/** Shared WGSL: the fullscreen triangle, the generator context and premultiplied blend modes. */
export const STD_WGSL = /* wgsl */ `
struct Ctx { uv: vec2f, res: vec2f, time: f32, scroll: f32 };
struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VOut {
var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
return VOut(vec4f(p[i], 0.0, 1.0), p[i] * 0.5 + 0.5);
}
fn blend_normal(s: vec4f, d: vec4f) -> vec4f { return s + d * (1.0 - s.a); }
fn blend_screen(s: vec4f, d: vec4f) -> vec4f { return s + d - s * d; }
fn blend_add(s: vec4f, d: vec4f) -> vec4f {
let a = s.a + d.a - s.a * d.a;
return vec4f(min(s.rgb + d.rgb, vec3f(a)), a);
}
fn blend_multiply(s: vec4f, d: vec4f) -> vec4f {
return vec4f(s.rgb * d.rgb + s.rgb * (1.0 - d.a) + d.rgb * (1.0 - s.a), s.a + d.a - s.a * d.a);
}
fn blend_overlay(s: vec4f, d: vec4f) -> vec4f {
let m = select(s.a * d.a - 2.0 * (d.a - d.rgb) * (s.a - s.rgb), 2.0 * s.rgb * d.rgb, 2.0 * d.rgb <= vec3f(d.a));
return vec4f(m + s.rgb * (1.0 - d.a) + d.rgb * (1.0 - s.a), s.a + d.a - s.a * d.a);
}
`
