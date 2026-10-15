<script setup lang="ts">
import type { ParamSpec } from '@goatsoft/aurora'
import type { ModifierId } from '@goatsoft/aurora-format'
import { ScrubField } from '@goatsoft/aurora-editor-ui'
import { MODIFIERS } from '@goatsoft/aurora-format'
import { useStudio } from '@/editor/studio'

const studio = useStudio()
const definitions: { id: ModifierId, label: string, hint: string, controls: Record<string, ParamSpec> }[] = Object.entries(MODIFIERS).map(([id, modifier]) => ({ id: id as ModifierId, ...modifier }))

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
