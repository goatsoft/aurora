import type { AuroraDocument, AuroraLayer } from '@goatsoft/aurora-format'
import { compileCss } from '@goatsoft/aurora'
import blueHour from '~/presets/scenes/blue-hour.aurora'
import borealis from '~/presets/scenes/borealis.aurora'
import cityStorm from '~/presets/scenes/city-storm.aurora'
import cyberBay from '~/presets/scenes/cyber-bay.aurora'
import glacierNight from '~/presets/scenes/glacier-night.aurora'
import glacierStorm from '~/presets/scenes/glacier-storm.aurora'
import glacier from '~/presets/scenes/glacier.aurora'
import goldenHour from '~/presets/scenes/golden-hour.aurora'
import harborLights from '~/presets/scenes/harbor-lights.aurora'
import lagoon from '~/presets/scenes/lagoon.aurora'
import metropolis from '~/presets/scenes/metropolis.aurora'
import mistyForest from '~/presets/scenes/misty-forest.aurora'
import noirCity from '~/presets/scenes/noir-city.aurora'
import northernLights from '~/presets/scenes/northern-lights.aurora'
import polarNight from '~/presets/scenes/polar-night.aurora'
import skylineDawn from '~/presets/scenes/skyline-dawn.aurora'
import solarWinds from '~/presets/scenes/solar-winds.aurora'

export { blueHour, borealis, cityStorm, cyberBay, glacier, glacierNight, glacierStorm, goldenHour, harborLights, lagoon, metropolis, mistyForest, noirCity, northernLights, polarNight, skylineDawn, solarWinds }

/** A CSS-fallback thumbnail of one layer, for mock layer lists. */
export function layerThumb(doc: AuroraDocument, { mask: _, ...layer }: AuroraLayer): string {
  return `position:absolute;inset:-10%;${compileCss({ ...doc, canvas: { ...doc.canvas, fade: 'none' }, layers: [{ ...layer, opacity: 1 }] }).style}`
}
