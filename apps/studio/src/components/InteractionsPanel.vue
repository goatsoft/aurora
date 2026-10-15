<script setup lang="ts">
import type { Doc } from '@/editor/document'
import type { InteractionBindingInput, InteractionInput } from '@goatsoft/aurora-format'
import { ScrubField } from '@goatsoft/aurora-editor-ui'
import { INTERACTION_ACTIVATION, INTERACTION_BINDING_CONTROLS, INTERACTION_CONTROLS, INTERACTION_INPUTS, INTERACTION_LIMITS, INTERACTIONS, MODIFIERS } from '@goatsoft/aurora-format'
import { useStudio } from '@/editor/studio'

const studio = useStudio()
const modules = computed(() => studio.rendered.value.interactions ?? [])
const controls = (type: InteractionInput['type']) => INTERACTIONS[type].controls.map((key) => ({ key, ...INTERACTION_CONTROLS[key] }))
const activationOptions = Object.entries(INTERACTION_ACTIVATION.options).map(([value, label]) => ({ value, label }))
const inputs = (type: InteractionInput['type']) => Object.entries(INTERACTION_INPUTS).filter(([value]) => value !== 'travel' || type === 'impulse').map(([value, label]) => ({ value, label }))

function commit(index: number, module: InteractionInput | undefined, group?: string, base: Doc = studio.doc.value) {
  studio.commit(studio.ops.interaction(base, index, module), group)
}
function add(type: InteractionInput['type']) {
  if (modules.value.length >= INTERACTION_LIMITS.modules) return
  if (type === 'impulse') {
    const layer = studio.doc.value.layers.length
    const module: InteractionInput = { type, decay: 2, bindings: [
      { layer, parameter: 'x', input: 'x' }, { layer, parameter: 'y', input: 'y' },
      { layer, parameter: 'opacity', input: 'strength' }, { layer, parameter: 'time', input: 'travel' },
    ] }
    studio.layers.add({ type: 'ping', blend: 'screen', opacity: 0, params: { background: 0, repeat: 0, speed: 0.24, spacing: 0.5, decay: 3 }, colors: [0, 1, 2].map((i) => i % studio.doc.value.palette.length), mix: 'oklab' }, layer, studio.doc.value, module)
  } else commit(modules.value.length, { type, bindings: [
    { layer: studio.ui.layer, parameter: 'offsetX', input: 'x', amount: 0.12 },
    { layer: studio.ui.layer, parameter: 'offsetY', input: 'y', amount: 0.08 },
  ] })
  studio.seal()
}
function set(index: number, key: string, value: string | number) {
  const module = studio.doc.value.interactions![index]!
  commit(index, { ...module, [key]: value }, `interaction:${index}:${key}`)
}
function reset(index: number, key: string) {
  const module = { ...studio.doc.value.interactions![index]! }
  Reflect.deleteProperty(module, key)
  commit(index, module)
  studio.seal()
}
function binding(index: number, slot: number, value: InteractionBindingInput | undefined, base?: Doc) {
  const module = studio.doc.value.interactions![index]!
  const bindings = [...module.bindings]
  if (value) bindings[slot] = value
  else bindings.splice(slot, 1)
  commit(index, bindings.length ? { ...module, bindings } : undefined, `binding:${index}:${slot}`, base)
}
function editBinding(index: number, slot: number, change: Partial<InteractionBindingInput>) {
  binding(index, slot, { ...studio.doc.value.interactions![index]!.bindings[slot]!, ...change })
}
function resetBinding(index: number, slot: number, key: 'amount' | 'slot') {
  const value = { ...studio.doc.value.interactions![index]!.bindings[slot]! }
  Reflect.deleteProperty(value, key)
  binding(index, slot, value)
  studio.seal()
}
function target(index: number, slot: number, value: string) {
  const current = studio.doc.value.interactions![index]!.bindings[slot]!
  if (value === 'signal') {
    const { layer: _, ...rest } = current
    const base = studio.doc.value.modifiers?.signal ? studio.doc.value : studio.ops.modifier(studio.doc.value, 'signal', { amount: 0 })
    binding(index, slot, { ...rest, parameter: 'signal.amount' }, base)
  } else binding(index, slot, { ...current, layer: Number(value), parameter: 'offsetX', input: 'x' })
  studio.seal()
}
function parameters(layer: number | undefined) {
  if (layer === undefined) return Object.entries(MODIFIERS.signal.controls).map(([key, control]) => ({ value: `signal.${key}`, label: control.label }))
  const generator = studio.generator(studio.rendered.value.layers[layer]!.type)
  return [
    { value: 'offsetX', label: 'Horizontal offset' }, { value: 'offsetY', label: 'Vertical offset' },
    { value: 'opacity', label: 'Opacity' }, { value: 'time', label: 'Effect clock' },
    ...Object.entries(generator?.params ?? {}).map(([value, control]) => ({ value, label: control.label })),
  ]
}
const targets = computed(() => [
  ...studio.rendered.value.layers.map((layer, i) => ({ value: String(i), label: `${i + 1}. ${studio.generator(layer.type)?.label ?? layer.type}` })),
  { value: 'signal', label: 'Signal modifier' },
])
</script>

<template>
  <Section
    title="Interactions"
    hint="Add a response, then try it on the canvas. Input and playback are never saved as edits."
  >
    <div class="grid gap-2">
      <Button
        v-for="(spec, type) in INTERACTIONS"
        :key="type"
        size="sm"
        class="justify-start"
        :disabled="modules.length >= INTERACTION_LIMITS.modules"
        @click="add(type)"
      >
        <IHgAdd01 />{{ spec.label }}
      </Button>
    </div>
    <p class="mt-3 text-[11px] leading-relaxed text-muted-foreground">
      Focus the canvas. Arrows move the response; Enter emits a pulse; G grabs or releases; Escape resets.
    </p>
    <Row
      label="Enable pointer drag"
      hint="Reserves touch gestures on the canvas. Leave off to keep normal scrolling."
    >
      <Switch
        v-model="studio.ui.dragInteractions"
        label="Enable pointer drag"
      />
    </Row>
  </Section>
  <Section
    v-for="(module, index) in modules"
    :key="index"
    :title="INTERACTIONS[module.type].label"
    :hint="INTERACTIONS[module.type].hint"
  >
    <template #action>
      <Button
        size="icon-sm"
        :aria-label="`Remove ${INTERACTIONS[module.type].label} interaction`"
        @click="() => { commit(index, undefined); studio.seal() }"
      >
        <IHgDelete02 />
      </Button>
    </template>
    <Row label="Activation">
      <Select
        :model-value="module.activation"
        :options="activationOptions"
        label="Interaction activation"
        @update:model-value="(value) => { set(index, 'activation', value); studio.seal() }"
      />
    </Row>
    <template
      v-for="control in controls(module.type)"
      :key="control.key"
    >
      <Row
        :label="control.label"
        :hint="control.description"
      >
        <ScrubField
          :label="control.label"
          :description="control.description"
          :unit="'unit' in control ? control.unit : undefined"
          :model-value="module[control.key]"
          :min="control.min"
          :max="control.max"
          :step="control.step"
          :default="control.default"
          :set="studio.doc.value.interactions?.[index]?.[control.key] !== undefined"
          @update:model-value="(value) => set(index, control.key, value)"
          @reset="reset(index, control.key)"
          @end="studio.seal()"
        />
      </Row>
    </template>
    <div
      v-for="(value, slot) in module.bindings"
      :key="slot"
      class="mt-3 space-y-1.5 rounded-lg border border-panel-border p-2"
    >
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-medium text-muted-foreground">Response {{ slot + 1 }}</span>
        <Button
          size="icon-sm"
          :aria-label="`Remove response ${slot + 1}`"
          @click="() => { binding(index, slot, undefined); studio.seal() }"
        >
          <IHgDelete02 />
        </Button>
      </div>
      <Select
        :model-value="value.layer === undefined ? 'signal' : String(value.layer)"
        :options="targets"
        label="Response target"
        @update:model-value="(v) => target(index, slot, v)"
      />
      <Select
        :model-value="value.parameter"
        :options="parameters(value.layer)"
        label="Response control"
        @update:model-value="(v) => { editBinding(index, slot, { parameter: v }); studio.seal() }"
      />
      <Row label="Input">
        <Select
          :model-value="value.input"
          :options="inputs(module.type)"
          label="Response input"
          @update:model-value="(v) => { editBinding(index, slot, { input: v as InteractionBindingInput['input'] }); studio.seal() }"
        />
      </Row>
      <Row
        :label="INTERACTION_BINDING_CONTROLS.amount.label"
        :hint="INTERACTION_BINDING_CONTROLS.amount.description"
      >
        <ScrubField
          :label="`Response ${INTERACTION_BINDING_CONTROLS.amount.label.toLowerCase()}`"
          :description="INTERACTION_BINDING_CONTROLS.amount.description"
          :model-value="value.amount"
          :min="INTERACTION_BINDING_CONTROLS.amount.min"
          :max="INTERACTION_BINDING_CONTROLS.amount.max"
          :step="INTERACTION_BINDING_CONTROLS.amount.step"
          :default="INTERACTION_BINDING_CONTROLS.amount.default"
          :set="studio.doc.value.interactions?.[index]?.bindings[slot]?.amount !== undefined"
          @update:model-value="(amount) => editBinding(index, slot, { amount })"
          @reset="resetBinding(index, slot, 'amount')"
          @end="studio.seal()"
        />
      </Row>
      <Row
        v-if="module.type === 'impulse'"
        :label="INTERACTION_BINDING_CONTROLS.slot.label"
        :hint="INTERACTION_BINDING_CONTROLS.slot.description"
      >
        <ScrubField
          :label="INTERACTION_BINDING_CONTROLS.slot.label"
          :description="INTERACTION_BINDING_CONTROLS.slot.description"
          :model-value="value.slot"
          :min="INTERACTION_BINDING_CONTROLS.slot.min"
          :max="INTERACTION_BINDING_CONTROLS.slot.max"
          :step="INTERACTION_BINDING_CONTROLS.slot.step"
          :default="INTERACTION_BINDING_CONTROLS.slot.default"
          :set="studio.doc.value.interactions?.[index]?.bindings[slot]?.slot !== undefined"
          @update:model-value="(pulse) => editBinding(index, slot, { slot: pulse })"
          @reset="resetBinding(index, slot, 'slot')"
          @end="studio.seal()"
        />
      </Row>
    </div>
    <Button
      size="sm"
      class="mt-3"
      :disabled="module.bindings.length >= INTERACTION_LIMITS.bindings"
      @click="() => { binding(index, module.bindings.length, { layer: studio.ui.layer, parameter: 'offsetX', input: 'x', amount: 0.12 }); studio.seal() }"
    >
      <IHgAdd01 />Add response
    </Button>
  </Section>
</template>
