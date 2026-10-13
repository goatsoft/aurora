/** Runtime settings shared by every surface on the page. */
export interface AuroraConfig {
  /** Shared frame budget across all surfaces. ADR-0079: 30. */
  fps: number
  /** Cap on canvas size per axis, in device pixels. */
  maxPixels: number
  /** Fraction of devicePixelRatio to render at, up to 1 (full resolution). Backgrounds are soft, so 0.5 is indistinguishable. */
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

/**
 * Canvas pixels per CSS pixel for a surface `width` × `height` CSS pixels big: `pixelRatio` of the
 * device pixel ratio, never above the device's own resolution, and within `maxPixels` per axis.
 */
export function renderRatio(dpr: number, width: number, height: number, { pixelRatio, maxPixels }: Pick<AuroraConfig, 'pixelRatio' | 'maxPixels'> = config): number {
  const device = dpr || 1
  return Math.min(device * pixelRatio, device, maxPixels / Math.max(1, width), maxPixels / Math.max(1, height))
}
