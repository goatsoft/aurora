/** Runtime settings shared by every surface on the page. */
export interface AuroraConfig {
  /** Shared frame budget across all surfaces. ADR-0079: 30. */
  fps: number
  /** Cap on canvas size per axis, in device pixels. */
  maxPixels: number
  /** Fraction of devicePixelRatio to render at. Backgrounds are soft, so 0.5 is indistinguishable. */
  pixelRatio: number
  /** Use WebGPU on touch devices when available, or force the CSS fallback there. */
  touch: 'webgpu' | 'css'
  /** Render in a shared worker when the browser supports it. Disable to debug on the main thread. */
  worker: boolean
}

const config: AuroraConfig = { fps: 30, maxPixels: 1280, pixelRatio: 0.5, touch: 'webgpu', worker: true }

/** Changes runtime settings. Call before mounting surfaces; later mounts pick up the new values. */
export function configureAurora(options: Partial<AuroraConfig>): AuroraConfig {
  return Object.assign(config, options)
}

export function getConfig(): Readonly<AuroraConfig> {
  return config
}
