import { gamutMap, parseColor, rgbToOklab } from '@goatsoft/color'
import type { Oklab } from '@goatsoft/color'
import type { AuroraDocument, BlendMode } from '@goatsoft/aurora-format'
import { GENERATORS } from './generators/index'
import { colorIndices, paramValue } from './uniforms'

export interface CssFallback {
  /** `background-image`: every layer's images, top layer first, as CSS stacks them. */
  backgroundImage: string
  /** `background-blend-mode`, one entry per image. */
  backgroundBlendMode: string
  /** `mask-image` for the canvas fade, if any. */
  maskImage?: string
  /** Seconds per drift cycle for the compositor-only animation; 0 when the document is still. */
  drift: number
  /** The above as an inline style, ready for SSR. */
  style: string
}

/** CSS has no additive background blend; screen is the closest look. */
const CSS_BLEND: Record<BlendMode, string> = { normal: 'normal', screen: 'screen', add: 'screen', multiply: 'multiply', overlay: 'overlay' }

const FADE = {
  none: undefined,
  y: 'linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)',
  x: 'linear-gradient(to right, transparent, #000 22%, #000 78%, transparent)',
}

/** Seconds per drift cycle at motion speed 1. Slow enough to read as ambient, never as motion. */
const DRIFT_PERIOD = 40

/**
 * A slow, compositor-only drift for fallback layers: `transform` on an oversized layer, never a
 * repainting `filter`. Install once per document; the runtime only applies it when motion is allowed.
 */
export const DRIFT_KEYFRAMES = '@keyframes aurora-drift{0%{transform:translate3d(-2%,-1%,0) scale(1.08)}50%{transform:translate3d(2%,1.5%,0) scale(1.12)}100%{transform:translate3d(-2%,-1%,0) scale(1.08)}}'

function cssColor(color: string): Oklab {
  const parsed = parseColor(color)
  if (!parsed.ok) throw new Error(parsed.message)
  return rgbToOklab(gamutMap(parsed.color, 'srgb'))
}

/**
 * Compiles the CSS fallback shown without WebGPU (and painted first, before WebGPU takes over).
 * "auto" asks each generator for gradients approximating it; "css" uses the document's own layers.
 * Per-layer masks have no CSS equivalent in a background stack and are left out.
 */
export function compileCss(doc: AuroraDocument): CssFallback {
  const images: string[] = []
  const blends: string[] = []
  if (doc.fallback.mode === 'css') {
    images.push(...doc.fallback.layers)
    blends.push(...doc.fallback.layers.map(() => 'normal'))
  } else {
    for (const layer of [...doc.layers].reverse()) {
      const generator = GENERATORS[layer.type]
      if (!generator) continue
      const colors = colorIndices(layer, generator, doc.palette.length).map((i) => cssColor(doc.palette[i]!))
      const params = Object.fromEntries(Object.keys(generator.params).map((name) => [name, paramValue(layer, generator, name)]))
      const layerImages = generator.css({ colors, params, space: layer.mix, opacity: layer.opacity })
      images.push(...layerImages)
      blends.push(...layerImages.map(() => CSS_BLEND[layer.blend]))
    }
  }

  const maskImage = FADE[doc.canvas.fade]
  const drift = doc.motion.speed > 0 ? Number((DRIFT_PERIOD / doc.motion.speed).toFixed(2)) : 0
  const backgroundImage = images.join(', ') || 'none'
  const backgroundBlendMode = blends.join(', ') || 'normal'
  const style = [
    `background-image:${backgroundImage}`,
    `background-blend-mode:${backgroundBlendMode}`,
    ...(maskImage ? [`mask-image:${maskImage}`, `-webkit-mask-image:${maskImage}`] : []),
  ].join(';')
  return maskImage ? { backgroundImage, backgroundBlendMode, maskImage, drift, style } : { backgroundImage, backgroundBlendMode, drift, style }
}
