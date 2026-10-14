/** Shared authoring metadata; validation and reference docs are generated from this spec. */
export interface ModifierControl {
  default: number
  label: string
  description: string
  min: number
  max: number
  step: number
  unit?: string
}
export interface ModifierSpec {
  label: string
  hint: string
  controls: Record<string, ModifierControl>
}
export const MODIFIERS = {
  signal: {
    label: 'Signal distortion', hint: 'Tear, stretch and shake the complete scene. Disabled under reduced motion.',
    controls: {
      amount: { default: 0.35, label: 'Amount', description: 'Overall distortion strength. Zero leaves the scene unchanged.', min: 0, max: 1, step: 0.01 },
      shake: { default: 0.25, label: 'Shake', description: 'Horizontal judder during a distortion burst.', min: 0, max: 1, step: 0.01 },
      tearSize: { default: 0.15, label: 'Tear size', description: 'Height of the bands that stretch and slip sideways, relative to the scene\'s height.', min: 0.02, max: 0.5, step: 0.01 },
      separation: { default: 0.2, label: 'Colour separation', description: 'Separate colour channels around torn edges. Visible separation samples the scene three times; quiet frames use one sample.', min: 0, max: 1, step: 0.01 },
      tracking: { default: 0.15, label: 'Tracking', description: 'Brief vertical tracking slips during a distortion burst.', min: 0, max: 1, step: 0.01 },
      frequency: { default: 0.5, label: 'Burst rate', description: 'Burst cycles per second. Zero freezes the distortion while other layers can keep moving.', min: 0, max: 2, step: 0.01 },
      seed: { default: 0, label: 'Signal seed', description: 'Choose a different distortion pattern.', min: 0, max: 100, step: 1 },
    },
  },
  pixelate: {
    label: 'Pixelate', hint: 'Display blocks in canvas pixels; their CSS size depends on devicePixelRatio and configureAurora pixelRatio.',
    controls: {
      size: { default: 8, label: 'Block size', description: 'Block size in canvas pixels. One leaves the scene unchanged; the CSS size depends on the rendering pixel ratio.', min: 1, max: 64, step: 1, unit: 'px' },
    },
  },
  vignette: {
    label: 'Vignette', hint: 'Darken the edges to draw attention into the scene.',
    controls: {
      amount: { default: 0.45, label: 'Darkness', description: 'Edge darkness. Zero leaves the scene unchanged.', min: 0, max: 1, step: 0.01 },
      radius: { default: 0.45, label: 'Clear radius', description: 'Size of the clear centre, relative to the scene\'s shorter side.', min: 0, max: 1, step: 0.01 },
      softness: { default: 0.45, label: 'Softness', description: 'Width of the soft transition to the dark edges, relative to the shorter scene side.', min: 0.01, max: 1, step: 0.01 },
    },
  },
} as const satisfies Record<string, ModifierSpec>

export type ModifierId = keyof typeof MODIFIERS
