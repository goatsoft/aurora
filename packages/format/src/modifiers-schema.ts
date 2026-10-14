// Generated from MODIFIERS by test/modifier-spec.test.ts; regenerate with pnpm test -u.
import * as v from 'valibot'
import { range } from './range'

export const SIGNAL_DEFAULTS = { amount: 0.35, shake: 0.25, tearSize: 0.15, separation: 0.2, tracking: 0.15, frequency: 0.5, seed: 0 }
export const Signal = v.strictObject({
  amount: v.optional(range(0, 1, 'Overall distortion strength. Zero leaves the scene unchanged.'), SIGNAL_DEFAULTS.amount),
  shake: v.optional(range(0, 1, 'Horizontal judder during a distortion burst.'), SIGNAL_DEFAULTS.shake),
  tearSize: v.optional(range(0.02, 0.5, 'Height of the bands that stretch and slip sideways, relative to the scene\'s height.'), SIGNAL_DEFAULTS.tearSize),
  separation: v.optional(range(0, 1, 'Separate colour channels around torn edges. Visible separation samples the scene three times; quiet frames use one sample.'), SIGNAL_DEFAULTS.separation),
  tracking: v.optional(range(0, 1, 'Brief vertical tracking slips during a distortion burst.'), SIGNAL_DEFAULTS.tracking),
  frequency: v.optional(range(0, 2, 'Burst cycles per second. Zero freezes the distortion while other layers can keep moving.'), SIGNAL_DEFAULTS.frequency),
  seed: v.optional(v.pipe(range(0, 100, 'Choose a different distortion pattern.'), v.integer('must be a whole number')), SIGNAL_DEFAULTS.seed),
})

export const PIXELATE_DEFAULTS = { size: 8 }
export const Pixelate = v.strictObject({
  size: v.optional(v.pipe(range(1, 64, 'Block size in canvas pixels. One leaves the scene unchanged; the CSS size depends on the rendering pixel ratio.'), v.integer('must be a whole number')), PIXELATE_DEFAULTS.size),
})

export const VIGNETTE_DEFAULTS = { amount: 0.45, radius: 0.45, softness: 0.45 }
export const Vignette = v.strictObject({
  amount: v.optional(range(0, 1, 'Edge darkness. Zero leaves the scene unchanged.'), VIGNETTE_DEFAULTS.amount),
  radius: v.optional(range(0, 1, 'Size of the clear centre, relative to the scene\'s shorter side.'), VIGNETTE_DEFAULTS.radius),
  softness: v.optional(range(0.01, 1, 'Width of the soft transition to the dark edges, relative to the shorter scene side.'), VIGNETTE_DEFAULTS.softness),
})
