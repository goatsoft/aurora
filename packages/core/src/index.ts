export { FORMAT_VERSION } from '@goatsoft/aurora-format'

/** True when the current context exposes the WebGPU API. It does not guarantee an adapter. */
export function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}
