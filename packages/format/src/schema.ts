import * as v from 'valibot'
import { COLOR_SYNTAX, parseColor } from './parse-color'

/** Current `.aurora` format version. Files with a lower version are migrated forward. */
export const FORMAT_VERSION = 1

/** Magic value of the `format` field in every `.aurora` file. */
export const FORMAT_ID = 'aurora'

export const SCHEMA_URL = `https://aurora.goatsoft.io/schema/v${FORMAT_VERSION}.json`

export const BLEND_MODES = ['normal', 'screen', 'add', 'multiply', 'overlay'] as const
export const MIX_SPACES = ['oklab', 'srgb'] as const
export const FADES = ['none', 'x', 'y'] as const
export const REDUCED_MOTION = ['still', 'slow', 'css'] as const

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
  v.regex(/^\s*(?:#|oklch\(|oklab\(|color\()/i, `must be a colour: ${COLOR_SYNTAX}`),
  v.rawCheck(({ dataset, addIssue }) => {
    if (!dataset.typed) return
    const result = parseColor(dataset.value)
    if (!result.ok) addIssue({ message: result.message })
  }),
  v.description(`A colour: ${COLOR_SYNTAX}. OKLCH is preferred.`),
  v.examples(['oklch(0.68 0.16 245)', 'oklch(0.56 0.22 285 / 0.8)', '#4f8cff']),
)

const Canvas = v.strictObject({
  fade: v.optional(
    v.pipe(v.picklist(FADES), v.description('Edge fade: "y" fades top and bottom, "x" left and right.')),
    'none',
  ),
  fixed: v.optional(
    v.pipe(v.boolean(), v.description('Pin the background to the viewport instead of scrolling with its element.')),
    false,
  ),
  parallax: v.optional(unit('Scroll parallax: 0 scrolls with the page, 1 stays fixed.'), 0),
})

const Motion = v.strictObject({
  speed: v.optional(
    v.pipe(
      v.number(),
      v.minValue(0, 'must be 0 or more'),
      v.maxValue(10, 'must be 10 or less'),
      v.description('Global time multiplier. 0 freezes the background.'),
    ),
    1,
  ),
  reduced: v.optional(
    v.pipe(
      v.picklist(REDUCED_MOTION),
      v.description(
        'Behaviour under prefers-reduced-motion: "still" renders one frame, "slow" runs at a tenth of the speed, "css" uses the CSS fallback.',
      ),
    ),
    'still',
  ),
})

const LinearMask = v.strictObject({
  type: v.literal('linear'),
  angle: v.optional(v.pipe(v.number(), v.description('Direction in degrees, CSS convention (180 = top to bottom).')), 180),
  start: v.optional(unit('Where the fade starts along the direction (fully opaque before it).'), 0),
  end: v.optional(unit('Where the fade ends (fully transparent after it).'), 1),
})

const RadialMask = v.strictObject({
  type: v.literal('radial'),
  x: v.optional(unit('Centre, as a fraction of the width.'), 0.5),
  y: v.optional(unit('Centre, as a fraction of the height.'), 0.5),
  start: v.optional(unit('Radius where the fade starts, as a fraction of the half-diagonal.'), 0),
  end: v.optional(unit('Radius where the fade ends.'), 1),
})

const Mask = v.pipe(
  v.variant('type', [LinearMask, RadialMask]),
  v.description('Fades the layer out with a linear or radial ramp.'),
)

const ParamValue = v.union([v.number(), v.boolean(), v.string()])

const Layer = v.strictObject({
  type: v.pipe(
    v.string(),
    v.regex(/^[a-z][a-z\d]*(?:-[a-z\d]+)*$/, 'must be a generator id in kebab-case, like "aurora-fbm"'),
    v.description('Generator id, for example "aurora-fbm", "mesh" or "grain".'),
  ),
  blend: v.optional(
    v.pipe(v.picklist(BLEND_MODES), v.description('How this layer composites onto the layers below it.')),
    'normal',
  ),
  opacity: v.optional(unit('Layer opacity.'), 1),
  params: v.optional(
    v.pipe(
      v.record(v.string(), ParamValue),
      v.description('Generator parameters. Each generator defines its own names, ranges and defaults.'),
    ),
    {},
  ),
  colors: v.optional(
    v.pipe(
      v.array(v.pipe(v.number(), v.integer('must be a whole number'), v.minValue(0, 'must be 0 or more'))),
      v.description('Indices into the palette, in the order the generator uses them.'),
    ),
    [],
  ),
  mix: v.optional(
    v.pipe(
      v.picklist(MIX_SPACES),
      v.description('Colour space for blending this layer\'s colours. "srgb" exists for bit-exact GOAT parity.'),
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
  v.description('A CSS <image>, typically a gradient: radial-gradient(in oklab, …).'),
)

const Fallback = v.pipe(
  v.variant('mode', [
    v.strictObject({ mode: v.literal('auto') }),
    v.strictObject({
      mode: v.literal('css'),
      layers: v.pipe(v.array(CssImage), v.minLength(1, 'must have at least one layer')),
    }),
  ]),
  v.description('CSS shown without WebGPU: "auto" compiles it from the layers, "css" uses hand-tuned gradients.'),
)

export const AuroraSchema = v.pipe(
  v.strictObject({
    $schema: v.optional(v.pipe(v.string(), v.description('JSON Schema URL, for editor autocomplete.'))),
    format: v.pipe(v.literal(FORMAT_ID), v.description('Always "aurora".')),
    version: v.pipe(v.literal(FORMAT_VERSION), v.description('Format version. Older files are migrated forward on load.')),
    name: v.pipe(
      v.string(),
      v.nonEmpty('must not be empty'),
      v.maxLength(120, 'must be 120 characters or fewer'),
      v.description('Display name, shown in Studio and preset galleries.'),
    ),
    canvas: v.optional(Canvas, {}),
    motion: v.optional(Motion, {}),
    palette: v.pipe(
      v.array(Color),
      v.minLength(1, 'must have at least one colour'),
      v.maxLength(16, 'must have 16 colours or fewer'),
      v.description('Colours referenced by layers, by index.'),
    ),
    layers: v.pipe(
      v.array(Layer),
      v.minLength(1, 'must have at least one layer'),
      v.maxLength(16, 'must have 16 layers or fewer'),
      v.description('Layer stack, bottom first.'),
    ),
    fallback: v.optional(Fallback, { mode: 'auto' }),
  }),
  v.title('Aurora background'),
  v.description('An animated background for @goatsoft/aurora. Declarative: it never contains code.'),
)

/** A validated `.aurora` document with every default filled in. */
export type AuroraDocument = v.InferOutput<typeof AuroraSchema>
/** What you may write in a `.aurora` file: optional fields can be left out. */
export type AuroraInput = v.InferInput<typeof AuroraSchema>
export type AuroraLayer = AuroraDocument['layers'][number]
export type BlendMode = (typeof BLEND_MODES)[number]
export type MixSpace = (typeof MIX_SPACES)[number]
