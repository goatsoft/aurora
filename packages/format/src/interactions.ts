import type { ModifierControl } from './modifiers'

/** Shared authoring metadata; schemas, Studio controls and reference docs derive from this. */
export const INTERACTION_CONTROLS = {
  strength: { default: 1, min: 0, max: 2, step: 0.01, label: 'Strength', description: 'Response strength.' },
  smoothing: { default: 0.65, min: 0, max: 1, step: 0.01, label: 'Smoothing', description: 'Follow easing; 0 responds immediately.' },
  decay: { default: 1, min: 0.05, max: 5, step: 0.01, label: 'Settle time', description: 'Seconds for an impulse or return to settle.', unit: 's' },
  damping: { default: 0.75, min: 0, max: 1, step: 0.01, label: 'Damping', description: 'Grab spring damping; higher settles faster.' },
} as const satisfies Record<string, ModifierControl>

export const INTERACTIONS = {
  follow: { label: 'Follow', hint: 'Light follows the pointer, then eases back to rest.', controls: ['strength', 'smoothing', 'decay'] },
  impulse: { label: 'Impulse', hint: 'A tap emits a pulse that fades away.', controls: ['strength', 'decay'] },
  grab: { label: 'Grab & Release', hint: 'Pull the scene, then release it into a spring.', controls: ['strength', 'decay', 'damping'] },
} as const satisfies Record<string, { label: string, hint: string, controls: (keyof typeof INTERACTION_CONTROLS)[] }>

export const INTERACTION_BINDING_CONTROLS = {
  amount: { default: 1, min: -4, max: 4, step: 0.01, label: 'Amount', description: 'Add this much to the authored control at full input; negative values repel.' },
  slot: { default: 0, min: 0, max: 3, step: 1, label: 'Pulse slot', description: 'Impulse slot, from newest (0) to oldest (3).' },
} as const satisfies Record<string, ModifierControl>

export const INTERACTION_ACTIVATION = { default: 'both', options: { hover: 'Hover', focus: 'Focus', both: 'Hover or focus' } } as const
export const INTERACTION_INPUTS = { x: 'Horizontal', y: 'Vertical', strength: 'Strength', travel: 'Elapsed time' } as const
export const INTERACTION_LIMITS = { modules: 8, bindings: 64 } as const
