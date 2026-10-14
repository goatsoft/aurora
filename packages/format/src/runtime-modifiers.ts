// Generated from modifiers-schema.ts; metadata stays in the authoring schema. Regenerate with pnpm test -u.
import * as v from 'valibot'
import { range } from './runtime-range'
export const SIGNAL_DEFAULTS = { amount: 0.35, shake: 0.25, tearSize: 0.15, separation: 0.2, tracking: 0.15, frequency: 0.5, seed: 0 }
export const Signal = v.strictObject({
  amount: v.optional(range(0, 1), SIGNAL_DEFAULTS.amount),
  shake: v.optional(range(0, 1), SIGNAL_DEFAULTS.shake),
  tearSize: v.optional(range(0.02, 0.5), SIGNAL_DEFAULTS.tearSize),
  separation: v.optional(range(0, 1), SIGNAL_DEFAULTS.separation),
  tracking: v.optional(range(0, 1), SIGNAL_DEFAULTS.tracking),
  frequency: v.optional(range(0, 2), SIGNAL_DEFAULTS.frequency),
  seed: v.optional(v.pipe(range(0, 100), v.integer('must be a whole number')), SIGNAL_DEFAULTS.seed),
})
export const PIXELATE_DEFAULTS = { size: 8 }
export const Pixelate = v.strictObject({
  size: v.optional(v.pipe(range(1, 64), v.integer('must be a whole number')), PIXELATE_DEFAULTS.size),
})
export const VIGNETTE_DEFAULTS = { amount: 0.45, radius: 0.45, softness: 0.45 }
export const Vignette = v.strictObject({
  amount: v.optional(range(0, 1), VIGNETTE_DEFAULTS.amount),
  radius: v.optional(range(0, 1), VIGNETTE_DEFAULTS.radius),
  softness: v.optional(range(0.01, 1), VIGNETTE_DEFAULTS.softness),
})
