<script setup lang="ts">
import { snap } from '@/editor/document'

/**
 * A number you can scrub: drag anywhere on it left or right (shift for ×10, alt for ÷10), click to
 * type, arrow keys to nudge, double-click to reset. The track shows where the value sits in its
 * range. Values that are only the default read dimmer, so you can see what the file sets.
 */
const props = defineProps<{
  label: string
  min: number
  max: number
  step: number
  default: number
  unit?: string | undefined
  description?: string | undefined
  /** Whether the document sets this value (rather than using the default). */
  set?: boolean | undefined
}>()
const model = defineModel<number>({ required: true })
const emit = defineEmits<{ reset: [], end: [] }>()

const editing = ref(false)
const text = ref('')
const input = ref<HTMLInputElement>()
const scrubbing = ref(false)
const fill = computed(() => Math.min(1, Math.max(0, (model.value - props.min) / (props.max - props.min))))
const decimals = computed(() => Math.max(0, Math.ceil(-Math.log10(props.step))))
const display = computed(() => model.value.toFixed(decimals.value))

function clamp(v: number) {
  return snap(Math.min(props.max, Math.max(props.min, v)), props.step)
}

let startX = 0
let startValue = 0
let moved = false
function down(event: PointerEvent) {
  if (editing.value || event.button !== 0) return
  startX = event.clientX
  startValue = model.value
  moved = false
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function move(event: PointerEvent) {
  if (!(event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) return
  const dx = event.clientX - startX
  if (!moved && Math.abs(dx) < 3) return
  moved = true
  scrubbing.value = true
  // The whole range spans about 240 px; shift is coarse, alt is fine.
  const rate = ((props.max - props.min) / 240) * (event.shiftKey ? 10 : event.altKey ? 0.1 : 1)
  model.value = clamp(startValue + dx * rate)
}
function up(event: PointerEvent) {
  ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  if (scrubbing.value) emit('end')
  scrubbing.value = false
  if (!moved) startEdit()
}
function startEdit() {
  editing.value = true
  text.value = display.value
  void nextTick(() => input.value?.select())
}
function commitEdit() {
  const value = Number(text.value.replace(',', '.'))
  if (text.value.trim() !== '' && Number.isFinite(value)) model.value = clamp(value)
  editing.value = false
  emit('end')
}
function key(event: KeyboardEvent) {
  const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key]
  if (dir === undefined) return
  event.preventDefault()
  model.value = clamp(model.value + dir * props.step * (event.shiftKey ? 10 : 1))
}
</script>

<template>
  <div
    class="group relative flex h-7 cursor-ew-resize items-center overflow-hidden rounded-md bg-input px-2 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
    :class="scrubbing && 'bg-accent'"
    tabindex="0"
    role="slider"
    :aria-label="label"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuenow="model"
    :title="description"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @dblclick="emit('reset')"
    @keydown="key"
    @keyup="(e) => e.key.startsWith('Arrow') && emit('end')"
  >
    <div class="pointer-events-none absolute inset-y-0 left-0 bg-primary/18 transition-[width] duration-75" :style="{ width: `${fill * 100}%` }" />
    <div class="pointer-events-none absolute inset-y-1.5 w-px bg-primary/70" :style="{ left: `${fill * 100}%` }" />
    <input
      v-if="editing"
      ref="input"
      v-model="text"
      class="relative z-10 w-full bg-transparent text-right font-mono text-xs text-foreground tabular outline-none"
      @blur="commitEdit"
      @keydown.enter.prevent="commitEdit"
      @keydown.escape.prevent="editing = false"
    >
    <span v-else class="relative z-10 ml-auto font-mono text-xs tabular" :class="set ? 'text-foreground' : 'text-muted-foreground'">
      {{ display }}<span v-if="unit" class="ml-0.5 text-muted-foreground">{{ unit === 'deg' ? '°' : unit }}</span>
    </span>
  </div>
</template>
