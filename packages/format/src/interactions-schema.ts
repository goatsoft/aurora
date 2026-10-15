// Generated from INTERACTIONS by test/interaction-spec.test.ts; regenerate with pnpm test -u.
import * as v from 'valibot'
import { range } from './range'

export const MAX_INTERACTIONS = 8
export const MAX_INTERACTION_BINDINGS = 64
export const InteractionBindingControls = {
  input: v.picklist(['x', 'y', 'strength', 'travel']),
  amount: v.optional(range(-4, 4, 'Add this much to the authored control at full input; negative values repel.'), 1),
  slot: v.optional(v.pipe(range(0, 3, 'Impulse slot, from newest (0) to oldest (3).'), v.integer('must be a whole number')), 0),
}
export const InteractionControls = {
  type: v.picklist(['follow', 'impulse', 'grab']),
  activation: v.optional(v.picklist(['hover', 'focus', 'both']), 'both'),
  strength: v.optional(range(0, 2, 'Response strength.'), 1),
  smoothing: v.optional(range(0, 1, 'Follow easing; 0 responds immediately.'), 0.65),
  decay: v.optional(range(0.05, 5, 'Seconds for an impulse or return to settle.'), 1),
  damping: v.optional(range(0, 1, 'Grab spring damping; higher settles faster.'), 0.75),
}
