<script setup lang="ts">
import type { ParamSpec } from '@goatsoft/aurora'
import type { AuroraInput } from '@goatsoft/aurora-format'
import { ScrubField } from '@goatsoft/aurora-editor-ui'
import { PIXELATE_DEFAULTS, SIGNAL_DEFAULTS, VIGNETTE_DEFAULTS } from '@goatsoft/aurora-format'
import { useStudio } from '@/editor/studio'

type ModifierId = keyof NonNullable<AuroraInput['modifiers']>
const studio = useStudio()
const definitions: { id: ModifierId, label: string, hint: string, controls: Record<string, ParamSpec> }[] = [
  { id: 'signal', label: 'Signal distortion', hint: 'Tear, stretch and shake the complete scene.', controls: {
    amount: { default: SIGNAL_DEFAULTS.amount, label: 'Amount', description: 'Overall distortion. Zero leaves the scene unchanged.', min: 0, max: 1, step: 0.01 },
    shake: { default: SIGNAL_DEFAULTS.shake, label: 'Shake', description: 'Horizontal judder during a burst.', min: 0, max: 1, step: 0.01 },
    tearSize: { default: SIGNAL_DEFAULTS.tearSize, label: 'Tear size', description: 'Height of the bands that stretch and slip sideways.', min: 0.02, max: 0.5, step: 0.01 },
    separation: { default: SIGNAL_DEFAULTS.separation, label: 'Colour separation', description: 'Separate colour channels around torn edges. Costs more to render.', min: 0, max: 1, step: 0.01 },
    tracking: { default: SIGNAL_DEFAULTS.tracking, label: 'Tracking', description: 'Brief vertical slips during a burst.', min: 0, max: 1, step: 0.01 },
    frequency: { default: SIGNAL_DEFAULTS.frequency, label: 'Burst rate', description: 'Burst cycles per second. Zero freezes the distortion.', min: 0, max: 2, step: 0.01 },
    seed: { default: SIGNAL_DEFAULTS.seed, label: 'Signal seed', description: 'Choose a different distortion pattern.', min: 0, max: 100, step: 1 },
  } },
  { id: 'pixelate', label: 'Pixelate', hint: 'Turn the whole composition into display blocks.', controls: {
    size: { default: PIXELATE_DEFAULTS.size, label: 'Block size', description: 'Display block size in canvas pixels. One leaves the scene unchanged.', min: 1, max: 64, step: 1, unit: 'px' },
  } },
  { id: 'vignette', label: 'Vignette', hint: 'Darken the edges to draw attention into the scene.', controls: {
    amount: { default: VIGNETTE_DEFAULTS.amount, label: 'Darkness', description: 'Edge darkness. Zero leaves the scene unchanged.', min: 0, max: 1, step: 0.01 },
    radius: { default: VIGNETTE_DEFAULTS.radius, label: 'Clear radius', description: 'Size of the clear centre, relative to the shorter scene side.', min: 0, max: 1, step: 0.01 },
    softness: { default: VIGNETTE_DEFAULTS.softness, label: 'Softness', description: 'Width of the soft transition to the dark edges.', min: 0.01, max: 1, step: 0.01 },
  } },
]

function toggle(id: ModifierId, on: boolean) {
  studio.commit(studio.ops.modifier(studio.doc.value, id, on ? {} : undefined))
  studio.seal()
}
function set(id: ModifierId, key: string, value: number | undefined) {
  const next: Record<string, number | undefined> = { ...studio.doc.value.modifiers?.[id] }
  if (value === undefined) Reflect.deleteProperty(next, key)
  else next[key] = value
  studio.commit(studio.ops.modifier(studio.doc.value, id, next), `modifier:${id}:${key}`)
}
function current(id: ModifierId, key: string, fallback: number): number {
  const values: Record<string, number> | undefined = studio.rendered.value.modifiers?.[id]
  return values?.[key] ?? fallback
}
function authored(id: ModifierId, key: string): boolean {
  const values: Record<string, number | undefined> | undefined = studio.doc.value.modifiers?.[id]
  return values?.[key] !== undefined
}
</script>

<template>
  <Section
    title="Modifiers"
    hint="Transform the complete scene after combining its layers. The CSS fallback shows the original scene."
  >
    <div
      v-for="modifier in definitions"
      :key="modifier.id"
      class="space-y-1.5 border-t border-panel-border py-2 first:border-t-0"
    >
      <Row
        :label="modifier.label"
        :hint="modifier.hint"
      >
        <div class="flex justify-end">
          <Switch
            :label="modifier.label"
            :model-value="!!studio.rendered.value.modifiers?.[modifier.id]"
            @update:model-value="(on) => toggle(modifier.id, on)"
          />
        </div>
      </Row>
      <template v-if="studio.rendered.value.modifiers?.[modifier.id]">
        <Row
          v-for="(control, key) in modifier.controls"
          :key="key"
          :label="control.label"
          :hint="control.description"
        >
          <ScrubField
            :label="control.label"
            :description="control.description"
            :model-value="current(modifier.id, key, control.default)"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            :unit="control.unit"
            :default="control.default"
            :set="authored(modifier.id, key)"
            @update:model-value="(value) => set(modifier.id, key, value)"
            @reset="() => { set(modifier.id, key, undefined); studio.seal() }"
            @end="studio.seal()"
          />
        </Row>
      </template>
    </div>
  </Section>
</template>
