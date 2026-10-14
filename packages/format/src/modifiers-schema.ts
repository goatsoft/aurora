// Generated from MODIFIERS by test/modifier-spec.test.ts; regenerate with pnpm test -u.
import * as v from 'valibot'
import { range } from './range'

export const SIGNAL_DEFAULTS = { amount: 0.35, shake: 0.25, tearSize: 0.15, separation: 0.2, tracking: 0.15, frequency: 0.5, seed: 0 }
export const Signal = v.strictObject({
  amount: v.optional(range(0, 1, 'Distortion; 0 bypasses.'), SIGNAL_DEFAULTS.amount),
  shake: v.optional(range(0, 1, 'Horizontal burst judder.'), SIGNAL_DEFAULTS.shake),
  tearSize: v.optional(range(0.02, 0.5, 'Scene-relative band height.'), SIGNAL_DEFAULTS.tearSize),
  separation: v.optional(range(0, 1, 'RGB separation during bursts.'), SIGNAL_DEFAULTS.separation),
  tracking: v.optional(range(0, 1, 'Vertical burst slips.'), SIGNAL_DEFAULTS.tracking),
  frequency: v.optional(range(0, 2, 'Bursts/second; 0 freezes.'), SIGNAL_DEFAULTS.frequency),
  seed: v.optional(v.pipe(range(0, 100, 'Distortion pattern seed.'), v.integer('must be a whole number')), SIGNAL_DEFAULTS.seed),
})

export const PIXELATE_DEFAULTS = { size: 8 }
export const Pixelate = v.strictObject({
  size: v.optional(v.pipe(range(1, 64, 'Canvas pixels/block; 1 bypasses.'), v.integer('must be a whole number')), PIXELATE_DEFAULTS.size),
})

export const VIGNETTE_DEFAULTS = { amount: 0.45, radius: 0.45, softness: 0.45 }
export const Vignette = v.strictObject({
  amount: v.optional(range(0, 1, 'Edge darkness; 0 bypasses.'), VIGNETTE_DEFAULTS.amount),
  radius: v.optional(range(0, 1, 'Clear radius / shorter side.'), VIGNETTE_DEFAULTS.radius),
  softness: v.optional(range(0.01, 1, 'Edge softness / shorter side.'), VIGNETTE_DEFAULTS.softness),
})
