import type { AuroraDocument, AuroraLayer } from '@goatsoft/aurora-format'
import { compileCss } from '@goatsoft/aurora'
import blueHour from '~/presets/scenes/blue-hour.aurora'
import borealis from '~/presets/scenes/borealis.aurora'
import glacierNight from '~/presets/scenes/glacier-night.aurora'
import glacierStorm from '~/presets/scenes/glacier-storm.aurora'
import glacier from '~/presets/scenes/glacier.aurora'
import goldenHour from '~/presets/scenes/golden-hour.aurora'
import lagoon from '~/presets/scenes/lagoon.aurora'
import mistyForest from '~/presets/scenes/misty-forest.aurora'
import northernLights from '~/presets/scenes/northern-lights.aurora'
import polarNight from '~/presets/scenes/polar-night.aurora'

export { blueHour, borealis, glacier, glacierNight, glacierStorm, goldenHour, lagoon, mistyForest, northernLights, polarNight }

/** A CSS-fallback thumbnail of one layer, for mock layer lists. */
export function layerThumb(doc: AuroraDocument, { mask: _, ...layer }: AuroraLayer): string {
  return `position:absolute;inset:-10%;${compileCss({ ...doc, canvas: { ...doc.canvas, fade: 'none' }, layers: [{ ...layer, opacity: 1 }] }).style}`
}
