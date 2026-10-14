// Generated from schema.ts; metadata stays in the authoring schema. Regenerate with pnpm test -u.
import { parseColor } from '@goatsoft/color'
import * as v from 'valibot'
import { Pixelate, Signal, Vignette } from './runtime-modifiers'
import { range } from './runtime-range'
/** Current `.aurora` format version. Files with a lower version are migrated forward. */
export const FORMAT_VERSION = 1
/** Magic value of the `format` field in every `.aurora` file. */
export const FORMAT_ID = 'aurora'
export const SCHEMA_URL = `https://aurora.goatsoft.io/schema/v${FORMAT_VERSION}.json`
export const BLEND_MODES = ['normal', 'screen', 'add', 'multiply', 'overlay'] as const
export const MIX_SPACES = ['oklab', 'srgb'] as const
export const FADES = ['none', 'x', 'y'] as const
export const REDUCED_MOTION = ['still', 'slow', 'css'] as const
/** The most layers, and the most palette colours, a document can have. */
export const MAX_LAYERS = 16
export const MAX_COLORS = 16
const unit = () => range(0, 1)
const Color = v.pipe(v.string(), v.rawCheck(({ dataset, addIssue }) => {
  if (!dataset.typed)
    return
  const result = parseColor(dataset.value)
  if (!result.ok)
    addIssue({ message: result.message })
}))
const Canvas = v.strictObject({
  fade: v.optional(v.picklist(FADES), 'none'),
  fixed: v.optional(v.boolean(), false),
  parallax: v.optional(unit(), 0),
})
const Motion = v.strictObject({
  speed: v.optional(v.pipe(v.number(), v.minValue(0, 'must be 0 or more'), v.maxValue(10, 'must be 10 or less')), 1),
  reduced: v.optional(v.picklist(REDUCED_MOTION), 'still'),
})
const Modifiers = v.strictObject({ signal: v.optional(Signal), pixelate: v.optional(Pixelate), vignette: v.optional(Vignette) })
const LayerIndex = v.pipe(v.number(), v.integer('must be a whole number'), v.minValue(0, 'must be 0 or more'), v.maxValue(MAX_LAYERS - 1, `must be ${MAX_LAYERS - 1} or less`))
/** Bind a module's normalized input to a layer control or a signal modifier control. */
const InteractionBinding = v.strictObject({
  layer: v.optional(LayerIndex),
  parameter: v.pipe(v.string(), v.nonEmpty('must not be empty'), v.maxLength(64, 'must be 64 characters or fewer')),
  input: v.picklist(['x', 'y', 'strength', 'travel']),
  amount: v.optional(range(-4, 4), 1),
  slot: v.optional(v.pipe(range(0, 3), v.integer('must be a whole number')), 0),
})
const Interaction = v.strictObject({
  type: v.picklist(['follow', 'impulse', 'grab']),
  activation: v.optional(v.picklist(['hover', 'focus', 'both']), 'both'),
  strength: v.optional(range(0, 2), 1),
  smoothing: v.optional(unit(), 0.65),
  decay: v.optional(range(0.05, 5), 1),
  damping: v.optional(unit(), 0.75),
  bindings: v.pipe(v.array(InteractionBinding), v.minLength(1, 'must have at least one binding'), v.maxLength(64, 'must have 64 bindings or fewer')),
})
const LinearMask = v.strictObject({
  type: v.literal('linear'),
  angle: v.optional(v.number(), 180),
  start: v.optional(unit(), 0),
  end: v.optional(unit(), 1),
})
const RadialMask = v.strictObject({
  type: v.literal('radial'),
  x: v.optional(unit(), 0.5),
  y: v.optional(unit(), 0.5),
  start: v.optional(unit(), 0),
  end: v.optional(unit(), 1),
})
const Mask = v.variant('type', [LinearMask, RadialMask])
const ParamValue = v.union([v.number(), v.boolean(), v.string()])
const Layer = v.strictObject({
  type: v.pipe(v.string(), v.regex(/^[a-z][a-z\d]*(?:-[a-z\d]+)*$/, 'must be a generator id in kebab-case, like "aurora-fbm"')),
  blend: v.optional(v.picklist(BLEND_MODES), 'normal'),
  opacity: v.optional(unit(), 1),
  params: v.optional(v.record(v.string(), ParamValue), {}),
  colors: v.optional(v.array(v.pipe(v.number(), v.integer('must be a whole number'), v.minValue(0, 'must be 0 or more'))), []),
  mix: v.optional(v.picklist(MIX_SPACES), 'oklab'),
  mask: v.optional(Mask),
})
/** Rejects anything that could escape a CSS `background-image` value. */
const SAFE_CSS = /^[^;{}<>@\\]*$/
const CssImage = v.pipe(v.string(), v.nonEmpty('must not be empty'), v.regex(SAFE_CSS, 'must be a single CSS image value, without ; { } < > @ or \\'), v.check((s) => !/url\s*\(|expression\s*\(|image-set\s*\(/i.test(s), 'must not load resources (url(), image-set())'))
const Fallback = v.variant('mode', [
  v.strictObject({ mode: v.literal('auto') }),
  v.strictObject({
    mode: v.literal('css'),
    layers: v.pipe(v.array(CssImage), v.minLength(1, 'must have at least one layer')),
  }),
])
export const AuroraValidationSchema = v.strictObject({
  $schema: v.optional(v.string()),
  format: v.literal(FORMAT_ID),
  version: v.literal(FORMAT_VERSION),
  name: v.pipe(v.string(), v.nonEmpty('must not be empty'), v.maxLength(120, 'must be 120 characters or fewer')),
  canvas: v.optional(Canvas, {}),
  motion: v.optional(Motion, {}),
  modifiers: v.optional(Modifiers),
  interactions: v.optional(v.pipe(v.array(Interaction), v.minLength(1, 'must have at least one interaction'), v.maxLength(8, 'must have 8 interactions or fewer'))),
  palette: v.pipe(v.array(Color), v.minLength(1, 'must have at least one colour'), v.maxLength(MAX_COLORS, `must have ${MAX_COLORS} colours or fewer`)),
  layers: v.pipe(v.array(Layer), v.minLength(1, 'must have at least one layer'), v.maxLength(MAX_LAYERS, `must have ${MAX_LAYERS} layers or fewer`)),
  fallback: v.optional(Fallback, { mode: 'auto' }),
})
/** A validated `.aurora` document with every default filled in. */
export type AuroraDocument = v.InferOutput<typeof AuroraValidationSchema>
/** What you may write in a `.aurora` file: optional fields can be left out. */
export type AuroraInput = v.InferInput<typeof AuroraValidationSchema>
export type AuroraLayer = AuroraDocument['layers'][number]
export type BlendMode = (typeof BLEND_MODES)[number]
export type MixSpace = (typeof MIX_SPACES)[number]
export type SignalModifier = v.InferOutput<typeof Signal>
export type PixelateModifier = v.InferOutput<typeof Pixelate>
export type VignetteModifier = v.InferOutput<typeof Vignette>
export type AuroraInteraction = v.InferOutput<typeof Interaction>
export type InteractionInput = v.InferInput<typeof Interaction>
export type InteractionBindingInput = v.InferInput<typeof InteractionBinding>
