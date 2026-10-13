<script setup lang="ts">
import type { AuroraModule } from '@goatsoft/aurora'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import { GENERATORS } from '@goatsoft/aurora'
import { encodeShare, ScrubField } from '@goatsoft/aurora-editor-ui'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { layerThumb } from '@/lib/scenes'

/**
 * A working corner of Aurora Studio around the real scene: pick a layer, hide it, scrub its
 * parameters, pause it or change its speed, and the background updates live. Edits are local and
 * reset when `scene` changes; "Edit in Studio" opens the edited scene in Studio as a share link.
 * `inspect` picks the layer selected first, by generator id (default: the aurora layer, or the first).
 */
const props = defineProps<{ scene: AuroraModule, title?: string, inspect?: string }>()
defineSlots<{ controls?: () => unknown }>()

const doc = ref<AuroraDocument>(props.scene.doc)
const hidden = ref(new Set<number>())
const selected = ref(0)
const playing = ref(true)
function reset() {
  doc.value = props.scene.doc
  hidden.value = new Set()
  playing.value = true
  const i = doc.value.layers.findIndex((l) => l.type === (props.inspect ?? 'aurora-fbm'))
  selected.value = Math.max(0, i)
}
reset()
watch(() => props.scene, reset)

/** What runs: hidden layers are faded out rather than removed, so nothing recompiles; pausing sets speed 0. */
const rendered = computed<AuroraDocument>(() => {
  if (!hidden.value.size && playing.value) return doc.value
  return {
    ...doc.value,
    layers: doc.value.layers.map((l, i) => hidden.value.has(i) ? { ...l, opacity: 0 } : l),
    motion: { ...doc.value.motion, speed: playing.value ? doc.value.motion.speed : 0 },
  }
})
// Untouched, the imported module goes in as is (its CSS fallback is precompiled); once edited, the document.
const source = computed(() => rendered.value === props.scene.doc ? props.scene : rendered.value)

const layers = computed(() => doc.value.layers.map((layer, index) => ({
  index,
  label: GENERATORS[layer.type]?.label ?? layer.type,
  thumb: layerThumb(doc.value, layer),
})).reverse())
const layer = computed(() => doc.value.layers[selected.value]!)
const params = computed(() => Object.entries(GENERATORS[layer.value.type]?.params ?? {})
  .filter(([, spec]) => spec.ui !== 'seed' && spec.ui !== 'toggle')
  .map(([name, spec]) => {
    const raw = layer.value.params[name]
    return { name, spec, value: typeof raw === 'number' ? raw : spec.default }
  }))

function setParam(name: string, value: number | undefined) {
  const layers = doc.value.layers.map((l, i) => {
    if (i !== selected.value) return l
    const next = Object.fromEntries(Object.entries(l.params).filter(([key]) => key !== name))
    return { ...l, params: value === undefined ? next : { ...next, [name]: value } }
  })
  doc.value = { ...doc.value, layers }
}
function setSpeed(speed: number) {
  doc.value = { ...doc.value, motion: { ...doc.value.motion, speed } }
}
function toggle(index: number) {
  const next = new Set(hidden.value)
  if (!next.delete(index)) next.add(index)
  hidden.value = next
}

// The link carries what you see, minus hidden layers. Built after mounting: it needs CompressionStream.
const studioHref = ref('/studio/')
onMounted(() => {
  watch([doc, hidden], async () => {
    const shown = { ...doc.value, layers: doc.value.layers.filter((_, i) => !hidden.value.has(i)) }
    studioHref.value = `/studio/#${await encodeShare(shown)}`
  }, { immediate: true })
})
</script>

<template>
  <!-- A real border (with a lighter top edge) rather than a gradient showing through 1px of padding:
       that trick loses the border around the rounded corners. -->
  <figure class="overflow-hidden rounded-2xl border border-white/10 border-t-white/25 bg-[oklch(0.12_0.012_270)] shadow-[0_40px_120px_-30px_oklch(0_0_0/0.95)]">
    <div>
      <div class="grid h-11 grid-cols-[1fr_auto_1fr] items-center border-b border-white/8 px-4">
        <div class="flex gap-2">
          <span class="size-3 rounded-full bg-[#ff5f57]" /><span class="size-3 rounded-full bg-[#febc2e]" /><span class="size-3 rounded-full bg-[#28c840]" />
        </div>
        <span class="text-xs text-foreground/70">Aurora Studio · {{ props.title ?? doc.name }}</span>
        <div class="flex justify-end">
          <a
            :href="studioHref"
            class="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <IHgPaintBoard
              class="size-3.5"
              aria-hidden="true"
            /><span>Edit<span class="max-sm:hidden"> in Studio</span></span>
          </a>
        </div>
      </div>
      <div class="relative grid aspect-video grid-cols-[minmax(0,12rem)_1fr_minmax(0,14rem)] max-md:grid-cols-1">
        <div class="absolute inset-0">
          <!-- Switching scenes cross-fades: the old background stays until the new one has faded in. -->
          <Transition
            enter-active-class="transition-opacity duration-700"
            leave-active-class="transition-opacity duration-700"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <div
              :key="doc.name"
              class="absolute inset-0"
            >
              <AuroraBackground :src="source" />
            </div>
          </Transition>
        </div>
        <!-- Layers -->
        <div class="relative m-3 self-start rounded-xl bg-[oklch(0.13_0.012_270/0.8)] p-2 shadow-lg ring-1 ring-white/10 backdrop-blur-xl max-md:hidden">
          <div class="flex items-center justify-between px-1.5 pb-2">
            <p class="text-[11px] font-semibold">
              Layers
            </p>
          </div>
          <div
            v-for="row in layers"
            :key="row.index"
            class="flex items-center gap-1 rounded-lg"
            :class="row.index === selected && 'bg-primary/12 ring-1 ring-primary/40'"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :aria-pressed="row.index === selected"
              @click="selected = row.index"
            >
              <span
                class="relative size-7 shrink-0 overflow-hidden rounded-md bg-background ring-1 ring-white/10"
                :class="hidden.has(row.index) && 'opacity-40'"
              >
                <span
                  class="block"
                  :style="row.thumb"
                />
              </span>
              <span
                class="truncate text-[11px]"
                :class="hidden.has(row.index) && 'text-foreground/45'"
              >{{ row.label }}</span>
            </button>
            <button
              type="button"
              class="mr-1 grid size-6 shrink-0 place-items-center rounded-md text-foreground/50 outline-none hover:bg-white/8 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              :aria-label="`${hidden.has(row.index) ? 'Show' : 'Hide'} ${row.label}`"
              :aria-pressed="hidden.has(row.index)"
              @click="toggle(row.index)"
            >
              <IHgViewOff
                v-if="hidden.has(row.index)"
                class="size-3.5"
              />
              <IHgView
                v-else
                class="size-3.5"
              />
            </button>
          </div>
        </div>
        <!-- Controls on top, timeline below -->
        <div class="relative flex flex-col items-center justify-between gap-3 p-3">
          <slot name="controls" />
          <!-- Motion, as in Studio: play/pause and the scene's speed -->
          <div class="flex w-full max-w-72 items-center gap-2 rounded-full bg-[oklch(0.13_0.012_270/0.8)] p-1 pr-1.5 ring-1 ring-white/10 backdrop-blur-xl">
            <button
              type="button"
              class="grid size-7 shrink-0 place-items-center rounded-full outline-none hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-ring"
              :aria-label="playing ? 'Pause' : 'Play'"
              @click="playing = !playing"
            >
              <IHgPause
                v-if="playing"
                class="size-3.5"
              />
              <IHgPlay
                v-else
                class="size-3.5"
              />
            </button>
            <span class="text-[10px] text-foreground/70">Speed</span>
            <ScrubField
              class="flex-1"
              label="Scene speed"
              description="How fast the whole scene moves."
              :model-value="doc.motion.speed"
              :min="0"
              :max="4"
              :step="0.01"
              :default="1"
              unit="×"
              :set="doc.motion.speed !== 1"
              @update:model-value="setSpeed"
              @reset="setSpeed(1)"
            />
          </div>
        </div>
        <!-- Inspector -->
        <div class="relative m-3 self-start rounded-xl bg-[oklch(0.13_0.012_270/0.8)] p-3 shadow-lg ring-1 ring-white/10 backdrop-blur-xl max-md:hidden">
          <div class="flex items-center justify-between pb-2.5">
            <p class="text-[11px] font-semibold">
              Parameters
            </p>
            <span class="rounded-sm bg-white/8 px-1.5 py-0.5 text-[10px] text-foreground/70">{{ GENERATORS[layer.type]?.label ?? layer.type }}</span>
          </div>
          <div class="-mr-1 max-h-64 space-y-1.5 overflow-y-auto pr-1">
            <div
              v-for="{ name, spec, value } in params"
              :key="`${selected}-${name}`"
              class="grid grid-cols-[4.5rem_1fr] items-center gap-2"
            >
              <span
                class="truncate text-[10px] text-foreground/70"
                :title="spec.description"
              >{{ spec.label }}</span>
              <ScrubField
                :label="spec.label"
                :description="spec.description"
                :model-value="value"
                :min="spec.min"
                :max="spec.max"
                :step="spec.step"
                :default="spec.default"
                :unit="spec.unit"
                :set="layer.params[name] !== undefined"
                @update:model-value="(v: number) => setParam(name, v)"
                @reset="setParam(name, undefined)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </figure>
</template>
