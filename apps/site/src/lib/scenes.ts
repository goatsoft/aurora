import type { AuroraDocument, AuroraLayer } from '@goatsoft/aurora-format'
import { compileCss } from '@goatsoft/aurora'
import goldenHour from '~/presets/scenes/golden-hour.aurora'
import northernLights from '~/presets/scenes/northern-lights.aurora'
import polarNight from '~/presets/scenes/polar-night.aurora'

export { goldenHour, northernLights, polarNight }

/** A CSS-fallback thumbnail of one layer, for mock layer lists. */
export function layerThumb(doc: AuroraDocument, { mask: _, ...layer }: AuroraLayer): string {
  return `position:absolute;inset:-10%;${compileCss({ ...doc, canvas: { ...doc.canvas, fade: 'none' }, layers: [{ ...layer, opacity: 1 }] }).style}`
}
