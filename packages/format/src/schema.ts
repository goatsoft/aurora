import { parseColor } from '@goatsoft/color'
import * as v from 'valibot'
import { Pixelate, Signal, Vignette } from './modifiers-schema'
import { range } from './range'

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

const unit = (description: string) => range(0, 1, description)

const Color = v.pipe(
  v.string(),
  v.rawCheck(({ dataset, addIssue }) => {
    if (!dataset.typed) return
    const result = parseColor(dataset.value)
    if (!result.ok) addIssue({ message: result.message })
  }),
  v.description('Hex, OKLab/OKLCH or sRGB/P3; prefer OKLCH.'),
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

const Modifiers = v.strictObject({ signal: v.optional(Signal), pixelate: v.optional(Pixelate), vignette: v.optional(Vignette) })

const LayerIndex = v.pipe(v.number(), v.integer('must be a whole number'), v.minValue(0, 'must be 0 or more'), v.maxValue(MAX_LAYERS - 1, `must be ${MAX_LAYERS - 1} or less`))

/** Bind a module's normalized input to a layer control or a signal modifier control. */
const InteractionBinding = v.strictObject({
  layer: v.optional(LayerIndex),
  parameter: v.pipe(v.string(), v.nonEmpty('must not be empty'), v.maxLength(64, 'must be 64 characters or fewer'), v.description('Generator control, opacity, offsetX, offsetY, time, or signal.control.')),
  input: v.picklist(['x', 'y', 'strength', 'travel']),
  amount: v.optional(range(-4, 4, 'Add this much to the authored control at full input; negative values repel.'), 1),
  slot: v.optional(v.pipe(range(0, 3, 'Impulse slot, from newest (0) to oldest (3).'), v.integer('must be a whole number')), 0),
})

const Interaction = v.strictObject({
  type: v.picklist(['follow', 'impulse', 'grab']),
  activation: v.optional(v.picklist(['hover', 'focus', 'both']), 'both'),
  strength: v.optional(range(0, 2, 'Response strength.'), 1),
  smoothing: v.optional(unit('Follow easing; 0 responds immediately.'), 0.65),
  decay: v.optional(range(0.05, 5, 'Seconds for an impulse or return to settle.'), 1),
  damping: v.optional(unit('Grab spring damping; higher settles faster.'), 0.75),
  bindings: v.pipe(v.array(InteractionBinding), v.minLength(1, 'must have at least one binding'), v.maxLength(64, 'must have 64 bindings or fewer')),
})

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
    interactions: v.optional(v.pipe(v.array(Interaction), v.minLength(1, 'must have at least one interaction'), v.maxLength(8, 'must have 8 interactions or fewer'))),
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
export type AuroraInteraction = v.InferOutput<typeof Interaction>
export type InteractionInput = v.InferInput<typeof Interaction>
export type InteractionBindingInput = v.InferInput<typeof InteractionBinding>
