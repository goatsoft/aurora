export { BLEND_MODES, FADES, FORMAT_ID, FORMAT_VERSION, MIX_SPACES, REDUCED_MOTION, SCHEMA_URL, AuroraSchema } from './schema'
export type { AuroraDocument, AuroraInput, AuroraLayer, BlendMode, MixSpace } from './schema'
export { assertAurora, defineAurora, parseAurora, stringifyAurora } from './document'
export type { ParseResult } from './document'
export { AuroraFormatError } from './issues'
export type { FormatIssue } from './issues'
export { MIGRATIONS, migrate } from './migrate'
export type { Migration, MigrateResult } from './migrate'
export {
  deltaEOK,
  gamutMap,
  inGamut,
  linearToSrgb,
  oklabToOklch,
  oklabToRgb,
  oklchToOklab,
  rgbToOklab,
  srgbToLinear,
} from './color'
export type { Oklab, Oklch, Rgb, RgbSpace } from './color'
export { COLOR_SYNTAX, formatOklch, parseColor } from './parse-color'
export type { ColorParseResult } from './parse-color'
