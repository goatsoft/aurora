// Generated from interactions-schema.ts; metadata stays in the authoring schema. Regenerate with pnpm test -u.
import * as v from 'valibot'
import { range } from './runtime-range'
export const MAX_INTERACTIONS = 8
export const MAX_INTERACTION_BINDINGS = 64
export const InteractionBindingControls = {
  input: v.picklist(['x', 'y', 'strength', 'travel']),
  amount: v.optional(range(-4, 4), 1),
  slot: v.optional(v.pipe(range(0, 3), v.integer('must be a whole number')), 0),
}
export const InteractionControls = {
  type: v.picklist(['follow', 'impulse', 'grab']),
  activation: v.optional(v.picklist(['hover', 'focus', 'both']), 'both'),
  strength: v.optional(range(0, 2), 1),
  smoothing: v.optional(range(0, 1), 0.65),
  decay: v.optional(range(0.05, 5), 1),
  damping: v.optional(range(0, 1), 0.75),
}
