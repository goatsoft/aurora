import { MATRICES } from './oklab'
import type { Mat3 } from './oklab'

const literal = (n: number) => {
  const text = String(n)
  return /[.e]/.test(text) ? text : `${text}.0`
}

/** WGSL is column-major, so the row-major matrix is written column by column. */
const mat3 = (m: Mat3) =>
  `mat3x3f(${[0, 1, 2].map((col) => m.map((row) => literal(row[col]!)).join(', ')).join(',  ')})`

/**
 * WGSL for the same conversions as the TypeScript API, generated from the same matrices,
 * so shaders and CPU code can never drift apart. Every symbol is prefixed `color_`.
 *
 * - `color_srgb_encode` / `color_srgb_decode`: the sRGB (and Display P3) transfer function.
 * - `color_oklab_to_linear_srgb`, `color_oklab_to_linear_p3`: OKLab to linear RGB, unclamped.
 * - `color_linear_srgb_to_linear_p3`: for sRGB content on a Display P3 canvas.
 */
export const COLOR_WGSL = /* wgsl */ `
const COLOR_OKLAB_TO_LMS = ${mat3(MATRICES.OKLAB_TO_LMS)};
const COLOR_LMS_TO_LINEAR_SRGB = ${mat3(MATRICES.LMS_TO_LINEAR_SRGB)};
const COLOR_LINEAR_SRGB_TO_LINEAR_P3 = ${mat3(MATRICES.LINEAR_SRGB_TO_LINEAR_P3)};

fn color_srgb_encode(c: vec3f) -> vec3f {
  let x = clamp(c, vec3f(0.0), vec3f(1.0));
  return select(1.055 * pow(x, vec3f(1.0 / 2.4)) - 0.055, x * 12.92, x <= vec3f(0.0031308));
}

fn color_srgb_decode(c: vec3f) -> vec3f {
  return select(pow((c + 0.055) / 1.055, vec3f(2.4)), c / 12.92, c <= vec3f(0.04045));
}

fn color_oklab_to_linear_srgb(lab: vec3f) -> vec3f {
  let lms = COLOR_OKLAB_TO_LMS * lab;
  return COLOR_LMS_TO_LINEAR_SRGB * (lms * lms * lms);
}

fn color_linear_srgb_to_linear_p3(c: vec3f) -> vec3f {
  return COLOR_LINEAR_SRGB_TO_LINEAR_P3 * c;
}

fn color_oklab_to_linear_p3(lab: vec3f) -> vec3f {
  return color_linear_srgb_to_linear_p3(color_oklab_to_linear_srgb(lab));
}
`
