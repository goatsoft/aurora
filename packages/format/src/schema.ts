import { parseColor } from '@goatsoft/color'
import * as v from 'valibot'

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

const range = (min: number, max: number, description: string) =>
  v.pipe(
    v.number(),
    v.minValue(min, `must be between ${min} and ${max}`),
    v.maxValue(max, `must be between ${min} and ${max}`),
    v.description(description),
  )

const unit = (description: string) => range(0, 1, description)

const Color = v.pipe(
  v.string(),
  v.rawCheck(({ dataset, addIssue }) => {
    if (!dataset.typed) return
    const result = parseColor(dataset.value)
    if (!result.ok) addIssue({ message: result.message })
  }),
  v.description('Hex, RGB/HSL, OKLab/OKLCH or sRGB/P3; prefer OKLCH.'),
  v.examples(['oklch(0.68 0.16 245)', 'oklch(0.56 0.22 285 / 0.8)', '#4f8cff']),
)

const Canvas = v.strictObject({
  fade: v.optional(
    v.pipe(v.picklist(FADES), v.description('Edge fade: y = top/bottom; x = left/right.')),
    'none',
  ),
  fixed: v.optional(
    v.pipe(v.boolean(), v.description('Pin to the viewport.')),
    false,
  ),
  parallax: v.optional(unit('Scroll parallax: 0 moves, 1 stays fixed.'), 0),
})

const Motion = v.strictObject({
  speed: v.optional(
    v.pipe(
      v.number(),
      v.minValue(0, 'must be 0 or more'),
      v.maxValue(10, 'must be 10 or less'),
      v.description('Time multiplier; 0 freezes.'),
    ),
    1,
  ),
  reduced: v.optional(
    v.pipe(
      v.picklist(REDUCED_MOTION),
      v.description(
        'Reduced motion: still renders once, slow uses 10% speed, css uses the fallback.',
      ),
    ),
    'still',
  ),
})

/** Defaults for the optional whole-scene signal distortion. */
export const SIGNAL_DEFAULTS = { amount: 0.35, shake: 0.25, tearSize: 0.15, separation: 0.2, tracking: 0.15, frequency: 0.5, seed: 0 }

const Signal = v.strictObject({
  amount: v.optional(unit('Distortion amount.'), SIGNAL_DEFAULTS.amount),
  shake: v.optional(unit('Horizontal shake.'), SIGNAL_DEFAULTS.shake),
  tearSize: v.optional(range(0.02, 0.5, 'Tear height.'), SIGNAL_DEFAULTS.tearSize),
  separation: v.optional(unit('RGB separation.'), SIGNAL_DEFAULTS.separation),
  tracking: v.optional(unit('Vertical slips.'), SIGNAL_DEFAULTS.tracking),
  frequency: v.optional(range(0, 2, 'Bursts/second; 0 freezes.'), SIGNAL_DEFAULTS.frequency),
  seed: v.optional(v.pipe(range(0, 100, 'Distortion seed.'), v.integer('must be a whole number')), SIGNAL_DEFAULTS.seed),
})

export const PIXELATE_DEFAULTS = { size: 8 }
export const VIGNETTE_DEFAULTS = { amount: 0.45, radius: 0.45, softness: 0.45 }

const Pixelate = v.strictObject({
  size: v.optional(v.pipe(range(1, 64, 'Pixels per block.'), v.integer('must be a whole number')), PIXELATE_DEFAULTS.size),
})
const Vignette = v.strictObject({
  amount: v.optional(unit('Edge darkness.'), VIGNETTE_DEFAULTS.amount),
  radius: v.optional(unit('Clear radius.'), VIGNETTE_DEFAULTS.radius),
  softness: v.optional(range(0.01, 1, 'Edge softness.'), VIGNETTE_DEFAULTS.softness),
})
const Modifiers = v.strictObject({ signal: v.optional(Signal), pixelate: v.optional(Pixelate), vignette: v.optional(Vignette) })

const LinearMask = v.strictObject({
  type: v.literal('linear'),
  angle: v.optional(v.pipe(v.number(), v.description('CSS angle in degrees (180 = downward).')), 180),
  start: v.optional(unit('Fade start (opaque before).'), 0),
  end: v.optional(unit('Fade end (transparent after).'), 1),
})

const RadialMask = v.strictObject({
  type: v.literal('radial'),
  x: v.optional(unit('Centre X as a width fraction.'), 0.5),
  y: v.optional(unit('Centre Y as a height fraction.'), 0.5),
  start: v.optional(unit('Fade start radius, relative to the half-diagonal.'), 0),
  end: v.optional(unit('Fade end radius.'), 1),
})

const Mask = v.pipe(
  v.variant('type', [LinearMask, RadialMask]),
  v.description('Linear or radial layer fade.'),
)

const ParamValue = v.union([v.number(), v.boolean(), v.string()])

const Layer = v.strictObject({
  type: v.pipe(
    v.string(),
    v.regex(/^[a-z][a-z\d]*(?:-[a-z\d]+)*$/, 'must be a generator id in kebab-case, like "aurora-fbm"'),
    v.description('Generator id, e.g. aurora-fbm.'),
  ),
  blend: v.optional(
    v.pipe(v.picklist(BLEND_MODES), v.description('Blend onto the layers below.')),
    'normal',
  ),
  opacity: v.optional(unit('Layer opacity.'), 1),
  params: v.optional(
    v.pipe(
      v.record(v.string(), ParamValue),
      v.description('Generator parameter names, ranges and defaults.'),
    ),
    {},
  ),
  colors: v.optional(
    v.pipe(
      v.array(v.pipe(v.number(), v.integer('must be a whole number'), v.minValue(0, 'must be 0 or more'))),
      v.description('Palette indices, in generator order.'),
    ),
    [],
  ),
  mix: v.optional(
    v.pipe(
      v.picklist(MIX_SPACES),
      v.description('oklab mixing; srgb preserves classic parity.'),
    ),
    'oklab',
  ),
  mask: v.optional(Mask),
})

/** Rejects anything that could escape a CSS `background-image` value. */
const SAFE_CSS = /^[^;{}<>@\\]*$/
const CssImage = v.pipe(
  v.string(),
  v.nonEmpty('must not be empty'),
  v.regex(SAFE_CSS, 'must be a single CSS image value, without ; { } < > @ or \\'),
  v.check((s) => !/url\s*\(|expression\s*\(|image-set\s*\(/i.test(s), 'must not load resources (url(), image-set())'),
  v.description('CSS image, e.g. an OKLab gradient.'),
)

const Fallback = v.pipe(
  v.variant('mode', [
    v.strictObject({ mode: v.literal('auto') }),
    v.strictObject({
      mode: v.literal('css'),
      layers: v.pipe(v.array(CssImage), v.minLength(1, 'must have at least one layer')),
    }),
  ]),
  v.description('CSS fallback: auto from layers, css from gradients.'),
)

export const AuroraSchema = v.pipe(
  v.strictObject({
    $schema: v.optional(v.pipe(v.string(), v.description('JSON Schema URL for autocomplete.'))),
    format: v.pipe(v.literal(FORMAT_ID), v.description('Always "aurora".')),
    version: v.pipe(v.literal(FORMAT_VERSION), v.description('Version; old files migrate on load.')),
    name: v.pipe(
      v.string(),
      v.nonEmpty('must not be empty'),
      v.maxLength(120, 'must be 120 characters or fewer'),
      v.description('Studio/gallery name.'),
    ),
    canvas: v.optional(Canvas, {}),
    motion: v.optional(Motion, {}),
    modifiers: v.optional(Modifiers),
    palette: v.pipe(
      v.array(Color),
      v.minLength(1, 'must have at least one colour'),
      v.maxLength(MAX_COLORS, `must have ${MAX_COLORS} colours or fewer`),
      v.description('Colours referenced by layers, by index.'),
    ),
    layers: v.pipe(
      v.array(Layer),
      v.minLength(1, 'must have at least one layer'),
      v.maxLength(MAX_LAYERS, `must have ${MAX_LAYERS} layers or fewer`),
      v.description('Layer stack, bottom first.'),
    ),
    fallback: v.optional(Fallback, { mode: 'auto' }),
  }),
  v.title('Aurora background'),
  v.description('Animated @goatsoft/aurora background; data only.'),
)

/** A validated `.aurora` document with every default filled in. */
export type AuroraDocument = v.InferOutput<typeof AuroraSchema>
/** What you may write in a `.aurora` file: optional fields can be left out. */
export type AuroraInput = v.InferInput<typeof AuroraSchema>
export type AuroraLayer = AuroraDocument['layers'][number]
export type BlendMode = (typeof BLEND_MODES)[number]
export type MixSpace = (typeof MIX_SPACES)[number]

export type SignalModifier = v.InferOutput<typeof Signal>

export type PixelateModifier = v.InferOutput<typeof Pixelate>
export type VignetteModifier = v.InferOutput<typeof Vignette>
