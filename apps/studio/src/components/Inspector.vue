<script setup lang="ts">
import { BLEND_MODES, REDUCED_MOTION } from '@goatsoft/aurora-format'
import type { ParamSpec } from '@goatsoft/aurora'
import { useStudio } from '@/editor/studio'
import { generatorIcon } from '@/lib/generators'

/**
 * The inspector: the selected layer's controls, generated from its generator's param specs, and the
 * document's palette, canvas and motion. Values the file doesn't set show their default, dimmed;
 * double-click a field to reset it.
 */
const studio = useStudio()
const { ui } = studio
const tab = ref<'layer' | 'document'>('layer')

const index = computed(() => ui.layer)
const layer = computed(() => studio.rendered.value.layers[index.value])
const authored = computed(() => studio.doc.value.layers[index.value])
const generator = computed(() => (layer.value ? studio.generator(layer.value.type) : undefined))
const params = computed(() => Object.entries(generator.value?.params ?? {}) as [string, ParamSpec][])

const set = (group: string, next: ReturnType<typeof studio.ops.rename>) => studio.commit(next, group)
const end = () => studio.seal()

function param(name: string): number {
  const value = layer.value?.params[name]
  return typeof value === 'number' ? value : generator.value?.params[name]?.default ?? 0
}
function setParam(name: string, value: number | undefined) {
  set(`param:${index.value}:${name}`, studio.ops.param(studio.doc.value, index.value, name, value))
}
function shuffle(name: string, spec: ParamSpec) {
  setParam(name, Math.round(spec.min + Math.random() * (spec.max - spec.min)))
  end()
}

function setLayer<K extends 'blend' | 'opacity' | 'mix' | 'mask' | 'colors'>(key: K, value: Parameters<typeof studio.ops.layer<K>>[3]) {
  set(`layer:${index.value}:${key}`, studio.ops.layer(studio.doc.value, index.value, key, value))
}

const generatorOptions = computed(() => studio.generators.value.map((g) => ({ value: g.id, label: g.label })))
function retype(id: string) {
  const next = studio.generator(id)
  if (!next) return
  studio.commit(studio.ops.retype(studio.doc.value, index.value, id, Object.keys(next.params)))
}

// Colours: one chip per colour the generator reads, each pointing at a palette entry.
// Like the runtime: a layer without `colors` reads the palette in order, wrapping around.
const colorSlots = computed(() => {
  const own = layer.value?.colors ?? []
  const source = own.length ? own : studio.rendered.value.palette.map((_, i) => i)
  return Array.from({ length: generator.value?.colors ?? 0 }, (_, k) => source[k % source.length]!)
})
function pointColor(slot: number, paletteIndex: number) {
  const colors = [...colorSlots.value]
  colors[slot] = paletteIndex
  setLayer('colors', colors)
  end()
}

// Masks.
const maskType = computed(() => layer.value?.mask?.type ?? 'none')
function setMask(type: string) {
  if (type === 'none') setLayer('mask', undefined)
  else if (type === 'linear') setLayer('mask', { type: 'linear', angle: 180, start: 0, end: 1 })
  else setLayer('mask', { type: 'radial', x: 0.5, y: 0.5, start: 0, end: 1 })
  end()
}
function setMaskField(key: string, value: number) {
  const mask = layer.value?.mask
  if (mask) setLayer('mask', { ...mask, [key]: value } as typeof mask)
}

// Document.
const doc = computed(() => studio.rendered.value)
const authoredDoc = computed(() => studio.doc.value)
const editing = ref<number>()
function setColor(i: number, css: string) {
  set(`color:${i}`, studio.ops.color(studio.doc.value, i, css))
}
function addColor(css = 'oklch(0.7 0.15 250)') {
  if (studio.doc.value.palette.length >= 16) return studio.notify('A palette holds up to 16 colours.', 'error')
  studio.commit(studio.ops.addColor(studio.doc.value, css))
  editing.value = studio.doc.value.palette.length - 1
}

const blendOptions = BLEND_MODES.map((value) => ({ value, label: value[0]!.toUpperCase() + value.slice(1) }))
const reducedOptions = REDUCED_MOTION.map((value) => ({ value, label: { still: 'One still frame', slow: 'Slow motion', css: 'CSS fallback' }[value] }))
</script>

<template>
  <aside class="glass absolute top-20 right-4 bottom-24 z-20 flex w-[316px] flex-col overflow-hidden rounded-2xl animate-[rise-in_450ms_cubic-bezier(0.2,0.9,0.1,1)]">
    <div class="shrink-0 p-1.5">
      <Segmented v-model="tab" :options="[{ value: 'layer', label: 'Layer' }, { value: 'document', label: 'Document' }]" size="sm" />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <template v-if="tab === 'layer' && layer && generator">
        <div class="flex items-center gap-2.5 px-3 pt-2 pb-3">
          <div class="grid size-9 shrink-0 place-items-center rounded-xl bg-input">
            <component :is="generatorIcon(layer.type)" class="size-4.5" />
          </div>
          <div class="min-w-0 flex-1">
            <Select :model-value="layer.type" :options="generatorOptions" label="Generator" @update:model-value="retype" />
          </div>
          <Tip label="Duplicate" keys="⌘ D">
            <Button size="icon-sm" aria-label="Duplicate layer" @click="studio.layers.duplicate(index)"><IHgCopy01 /></Button>
          </Tip>
          <Tip label="Delete" keys="⌫">
            <Button size="icon-sm" aria-label="Delete layer" :disabled="studio.doc.value.layers.length <= 1" @click="studio.layers.remove(index)"><IHgDelete02 /></Button>
          </Tip>
        </div>
        <p class="-mt-1 px-3 pb-3 text-[11px] leading-snug text-muted-foreground">{{ generator.description }}</p>

        <Section title="Parameters">
          <Row v-for="[name, spec] in params" :key="name" :label="spec.label" :hint="spec.description">
            <div v-if="spec.ui === 'toggle'" class="flex justify-end">
              <Switch :label="spec.label" :model-value="param(name) >= 0.5" @update:model-value="(on) => { setParam(name, on ? 1 : 0); end() }" />
            </div>
            <div v-else class="flex gap-1">
              <ScrubField
                class="flex-1"
                :label="spec.label"
                :description="spec.description"
                :model-value="param(name)"
                :min="spec.min"
                :max="spec.max"
                :step="spec.step"
                :default="spec.default"
                :unit="spec.unit"
                :set="authored?.params?.[name] !== undefined"
                @update:model-value="(v) => setParam(name, v)"
                @reset="() => { setParam(name, undefined); end() }"
                @end="end"
              />
              <Tip v-if="spec.ui === 'seed'" label="Shuffle" keys="R">
                <Button size="icon-sm" variant="subtle" aria-label="Shuffle seed" @click="shuffle(name, spec)"><IHgShuffle /></Button>
              </Tip>
            </div>
          </Row>
        </Section>

        <Section title="Colours">
          <div class="flex flex-wrap gap-1.5">
            <Popover v-for="(paletteIndex, slot) in colorSlots" :key="slot" side="left" align="start" class="w-auto p-2">
              <template #trigger>
                <button
                  class="group relative size-9 rounded-xl ring-1 ring-panel-border transition-transform outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
                  :style="{ background: doc.palette[paletteIndex] }"
                  :aria-label="`Colour ${slot + 1}: palette ${paletteIndex + 1}`"
                >
                  <span class="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-[oklch(0.2_0.02_270)] text-[9px] font-semibold text-muted-foreground ring-1 ring-panel-border">{{ paletteIndex + 1 }}</span>
                </button>
              </template>
              <p class="mb-1.5 px-0.5 text-[11px] text-muted-foreground">Colour {{ slot + 1 }} uses palette</p>
              <div class="grid grid-cols-6 gap-1">
                <button
                  v-for="(css, i) in doc.palette"
                  :key="i"
                  class="size-7 rounded-lg ring-1 transition-transform hover:scale-110"
                  :class="i === paletteIndex ? 'ring-2 ring-primary' : 'ring-panel-border'"
                  :style="{ background: css }"
                  :aria-label="`Palette colour ${i + 1}`"
                  @click="pointColor(slot, i)"
                />
              </div>
            </Popover>
          </div>
        </Section>

        <Section title="Compositing">
          <Row label="Blend"><Select :model-value="layer.blend" :options="blendOptions" label="Blend" @update:model-value="(v) => { setLayer('blend', v); end() }" /></Row>
          <Row label="Opacity">
            <ScrubField label="Opacity" :model-value="layer.opacity" :min="0" :max="1" :step="0.01" :default="1" :set="authored?.opacity !== undefined" @update:model-value="(v) => setLayer('opacity', v)" @reset="() => { setLayer('opacity', undefined); end() }" @end="end" />
          </Row>
          <Row label="Mix in" hint="Colour space for blending this layer's colours. sRGB exists for GOAT parity.">
            <Segmented :model-value="layer.mix" :options="[{ value: 'oklab', label: 'OKLab' }, { value: 'srgb', label: 'sRGB' }]" size="sm" @update:model-value="(v) => { setLayer('mix', v); end() }" />
          </Row>
          <Row label="Mask">
            <Segmented :model-value="maskType" :options="[{ value: 'none', label: 'None' }, { value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' }]" size="sm" @update:model-value="setMask" />
          </Row>
          <template v-if="layer.mask?.type === 'linear'">
            <Row label="Angle"><ScrubField label="Angle" :model-value="layer.mask.angle" :min="0" :max="360" :step="1" :default="180" unit="deg" set @update:model-value="(v) => setMaskField('angle', v)" @end="end" /></Row>
            <Row label="Start"><ScrubField label="Start" :model-value="layer.mask.start" :min="0" :max="1" :step="0.01" :default="0" set @update:model-value="(v) => setMaskField('start', v)" @end="end" /></Row>
            <Row label="End"><ScrubField label="End" :model-value="layer.mask.end" :min="0" :max="1" :step="0.01" :default="1" set @update:model-value="(v) => setMaskField('end', v)" @end="end" /></Row>
          </template>
          <template v-if="layer.mask?.type === 'radial'">
            <Row label="Centre x"><ScrubField label="Centre x" :model-value="layer.mask.x" :min="0" :max="1" :step="0.01" :default="0.5" set @update:model-value="(v) => setMaskField('x', v)" @end="end" /></Row>
            <Row label="Centre y"><ScrubField label="Centre y" :model-value="layer.mask.y" :min="0" :max="1" :step="0.01" :default="0.5" set @update:model-value="(v) => setMaskField('y', v)" @end="end" /></Row>
            <Row label="Start"><ScrubField label="Start" :model-value="layer.mask.start" :min="0" :max="1" :step="0.01" :default="0" set @update:model-value="(v) => setMaskField('start', v)" @end="end" /></Row>
            <Row label="End"><ScrubField label="End" :model-value="layer.mask.end" :min="0" :max="1" :step="0.01" :default="1" set @update:model-value="(v) => setMaskField('end', v)" @end="end" /></Row>
          </template>
        </Section>
      </template>

      <template v-else-if="tab === 'document'">
        <Section title="Document">
          <Row label="Name">
            <input
              :value="authoredDoc.name"
              maxlength="120"
              aria-label="Name"
              class="h-7 w-full rounded-md bg-input px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              @input="(e) => set('name', studio.ops.rename(studio.doc.value, (e.target as HTMLInputElement).value || 'Untitled'))"
              @change="end"
            >
          </Row>
        </Section>

        <Section title="Palette">
          <template #action>
            <Tip label="Add colour"><Button size="icon-sm" aria-label="Add colour" @click="addColor()"><IHgAdd01 /></Button></Tip>
          </template>
          <div class="grid grid-cols-6 gap-1.5">
            <Popover
              v-for="(css, i) in authoredDoc.palette"
              :key="i"
              side="left"
              align="start"
              class="w-auto"
              :open="editing === i"
              @update:open="(open) => (editing = open ? i : undefined)"
            >
              <template #trigger>
                <button
                  class="group relative aspect-square rounded-xl ring-1 ring-panel-border transition-transform outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
                  :style="{ background: doc.palette[i] }"
                  :aria-label="`Edit colour ${i + 1}`"
                >
                  <span class="absolute bottom-0.5 left-1 text-[9px] font-semibold text-white/80 mix-blend-difference">{{ i + 1 }}</span>
                </button>
              </template>
              <ColorPicker
                :model-value="css"
                :page="ui.page"
                @update:model-value="(v) => setColor(i, v)"
                @end="end"
                @add="(c) => addColor(c)"
              />
              <div class="mt-2.5 flex justify-end border-t border-panel-border pt-2">
                <Button size="sm" :disabled="authoredDoc.palette.length <= 1" @click="() => { studio.apply(studio.ops.removeColor, i); editing = undefined }">
                  <IHgDelete02 />Remove colour
                </Button>
              </div>
            </Popover>
          </div>
        </Section>

        <Section title="Canvas">
          <Row label="Edge fade">
            <Segmented :model-value="doc.canvas.fade" :options="[{ value: 'none', label: 'None' }, { value: 'y', label: 'Vertical' }, { value: 'x', label: 'Sides' }]" size="sm" @update:model-value="(v) => { set('canvas:fade', studio.ops.canvas(studio.doc.value, 'fade', v)); end() }" />
          </Row>
          <Row label="Fixed" hint="Pin the background to the viewport instead of scrolling with its element.">
            <div class="flex justify-end"><Switch label="Fixed" :model-value="doc.canvas.fixed" @update:model-value="(v) => { set('canvas:fixed', studio.ops.canvas(studio.doc.value, 'fixed', v)); end() }" /></div>
          </Row>
          <Row label="Parallax" hint="0 scrolls with the page, 1 stays fixed.">
            <ScrubField label="Parallax" :model-value="doc.canvas.parallax" :min="0" :max="1" :step="0.01" :default="0" :set="authoredDoc.canvas?.parallax !== undefined" @update:model-value="(v) => set('canvas:parallax', studio.ops.canvas(studio.doc.value, 'parallax', v))" @reset="() => { set('canvas:parallax', studio.ops.canvas(studio.doc.value, 'parallax', undefined)); end() }" @end="end" />
          </Row>
        </Section>

        <Section title="Motion">
          <Row label="Speed" hint="Global time multiplier. 0 freezes the background.">
            <ScrubField label="Speed" :model-value="doc.motion.speed" :min="0" :max="10" :step="0.01" :default="1" :set="authoredDoc.motion?.speed !== undefined" @update:model-value="(v) => set('motion:speed', studio.ops.motion(studio.doc.value, 'speed', v))" @reset="() => { set('motion:speed', studio.ops.motion(studio.doc.value, 'speed', undefined)); end() }" @end="end" />
          </Row>
          <Row label="Reduced" hint="What visitors who prefer reduced motion see.">
            <Select :model-value="doc.motion.reduced" :options="reducedOptions" label="Reduced motion" @update:model-value="(v) => { set('motion:reduced', studio.ops.motion(studio.doc.value, 'reduced', v)); end() }" />
          </Row>
        </Section>
      </template>
    </div>

    <div v-if="studio.issues.value.length" class="shrink-0 border-t border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
      <p v-for="issue in studio.issues.value.slice(0, 3)" :key="issue.path"><code class="font-mono">{{ issue.path }}</code> {{ issue.message }}</p>
    </div>
  </aside>
</template>
