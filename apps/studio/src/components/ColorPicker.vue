<script setup lang="ts">
import type { Oklch } from '@goatsoft/color'
import { contrastRatio, gamutMap, inGamut, maxChroma, oklabToOklch, oklchToOklab, parseColor } from '@goatsoft/color'
import { snap } from '@/editor/document'

/**
 * An OKLCH picker. The plane is lightness (up) by chroma (right) at the current hue, with the sRGB
 * gamut boundary drawn solid and Display P3 dashed; colours past sRGB are shown gamut-mapped. The
 * text field takes any CSS colour Aurora understands and keeps it as typed (the classic presets use
 * `color(srgb …)`); dragging writes canonical `oklch()`.
 */
const props = defineProps<{ page: 'dark' | 'light' }>()
const model = defineModel<string>({ required: true })
const emit = defineEmits<{ add: [css: string], end: [] }>()

const W = 232
const H = 148
const C_MAX = 0.37

function toLch(css: string): Oklch | undefined {
  const parsed = parseColor(css)
  return parsed.ok ? oklabToOklch(parsed.color) : undefined
}

// Hue survives at zero chroma, where the colour itself no longer has one.
const lch = reactive<Oklch>(toLch(model.value) ?? { l: 0.7, c: 0.15, h: 250, alpha: 1 })
const text = ref(model.value)
const textError = ref<string>()
watch(model, (css) => {
  if (css === write()) return
  text.value = css
  const next = toLch(css)
  if (!next) return
  Object.assign(lch, next.c < 1e-4 ? { ...next, h: lch.h } : next)
})

function write(): string {
  const l = snap(lch.l, 0.001)
  const c = snap(lch.c, 0.001)
  const h = snap(lch.h, 0.1)
  return lch.alpha < 1 ? `oklch(${l} ${c} ${h} / ${snap(lch.alpha, 0.01)})` : `oklch(${l} ${c} ${h})`
}

function update(patch: Partial<Oklch>) {
  Object.assign(lch, patch)
  const css = write()
  text.value = css
  textError.value = undefined
  model.value = css
}

function typed() {
  const parsed = parseColor(text.value)
  if (!parsed.ok) {
    textError.value = parsed.message
    return
  }
  textError.value = undefined
  model.value = text.value.trim()
  emit('end')
}

// The plane, redrawn when the hue changes.
const plane = ref<HTMLCanvasElement>()
const boundary = ref({ srgb: '', p3: '' })
function draw() {
  const ctx = plane.value?.getContext('2d')
  if (!ctx) return
  const image = ctx.createImageData(W, H)
  for (let y = 0; y < H; y++) {
    const l = 1 - y / (H - 1)
    const edge = maxChroma(l, lch.h)
    for (let x = 0; x < W; x++) {
      const c = (x / (W - 1)) * C_MAX
      const { r, g, b } = gamutMap(oklchToOklab({ l, c, h: lch.h, alpha: 1 }))
      // Past the sRGB edge, show the mapped colour dimmed so the boundary reads.
      const dim = c > edge ? 0.55 : 1
      const i = (y * W + x) * 4
      image.data[i] = r * 255 * dim
      image.data[i + 1] = g * 255 * dim
      image.data[i + 2] = b * 255 * dim
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  const line = (space: 'srgb' | 'display-p3') => Array.from({ length: 49 }, (_, k) => {
    const l = 1 - k / 48
    return `${k ? 'L' : 'M'}${((maxChroma(l, lch.h, space) / C_MAX) * W).toFixed(1)} ${((k / 48) * H).toFixed(1)}`
  }).join(' ')
  boundary.value = { srgb: line('srgb'), p3: line('display-p3') }
}
onMounted(draw)
watch(() => lch.h, () => requestAnimationFrame(draw))

function pick(event: PointerEvent, target: 'plane' | 'hue') {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
  if (target === 'plane') update({ c: x * C_MAX, l: 1 - y })
  else update({ h: x * 360 })
}
function drag(event: PointerEvent, target: 'plane' | 'hue') {
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  pick(event, target)
}

const oklab = computed(() => oklchToOklab(lch))
const gamut = computed(() => (inGamut(oklab.value) ? 'sRGB' : inGamut(oklab.value, 'display-p3') ? 'P3' : 'Out of P3'))
const pageText = computed(() => oklchToOklab(props.page === 'dark' ? { l: 0.96, c: 0.01, h: 270, alpha: 1 } : { l: 0.2, c: 0.02, h: 270, alpha: 1 }))
const contrast = computed(() => contrastRatio(oklab.value, pageText.value))
const harmonies = computed(() => [
  { label: 'Complement', h: 180 },
  { label: 'Triad', h: 120 },
  { label: 'Triad', h: 240 },
  { label: 'Analogous', h: 30 },
  { label: 'Analogous', h: -30 },
].map(({ label, h }) => {
  const hue = (((lch.h + h) % 360) + 360) % 360
  return { label, css: `oklch(${snap(lch.l, 0.001)} ${snap(lch.c, 0.001)} ${snap(hue, 0.1)})` }
}))
const hueStrip = `linear-gradient(to right in oklch longer hue, oklch(0.72 0.15 0), oklch(0.72 0.15 0))`
</script>

<template>
  <div class="flex w-[232px] flex-col gap-2.5">
    <div
      class="relative h-[148px] cursor-crosshair overflow-hidden rounded-lg ring-1 ring-panel-border"
      @pointerdown="drag($event, 'plane')"
      @pointermove="(e) => e.buttons && pick(e, 'plane')"
      @pointerup="emit('end')"
    >
      <canvas
        ref="plane"
        :width="W"
        :height="H"
        class="block size-full"
      />
      <svg
        class="pointer-events-none absolute inset-0 size-full"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
      >
        <path
          :d="boundary.p3"
          fill="none"
          stroke="white"
          stroke-opacity="0.45"
          stroke-width="1"
          stroke-dasharray="3 3"
          vector-effect="non-scaling-stroke"
        />
        <path
          :d="boundary.srgb"
          fill="none"
          stroke="white"
          stroke-opacity="0.8"
          stroke-width="1.25"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <div
        class="pointer-events-none absolute size-3.5 -translate-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_oklch(0_0_0/0.4),0_2px_8px_oklch(0_0_0/0.5)]"
        :style="{ left: `${(lch.c / C_MAX) * 100}%`, top: `${(1 - lch.l) * 100}%`, background: model }"
      />
    </div>

    <div
      class="relative h-3 cursor-ew-resize rounded-full ring-1 ring-panel-border"
      :style="{ background: hueStrip }"
      @pointerdown="drag($event, 'hue')"
      @pointermove="(e) => e.buttons && pick(e, 'hue')"
      @pointerup="emit('end')"
    >
      <div
        class="pointer-events-none absolute top-1/2 size-3.5 -translate-1/2 rounded-full border-2 border-white shadow-sm"
        :style="{ left: `${(lch.h / 360) * 100}%`, background: `oklch(0.72 0.15 ${lch.h})` }"
      />
    </div>

    <div class="grid grid-cols-3 gap-1">
      <ScrubField
        label="Lightness"
        :model-value="lch.l"
        :min="0"
        :max="1"
        :step="0.001"
        :default="lch.l"
        set
        @update:model-value="(l) => update({ l })"
        @end="emit('end')"
      />
      <ScrubField
        label="Chroma"
        :model-value="lch.c"
        :min="0"
        :max="0.4"
        :step="0.001"
        :default="lch.c"
        set
        @update:model-value="(c) => update({ c })"
        @end="emit('end')"
      />
      <ScrubField
        label="Hue"
        :model-value="lch.h"
        :min="0"
        :max="360"
        :step="0.1"
        :default="lch.h"
        unit="deg"
        set
        @update:model-value="(h) => update({ h })"
        @end="emit('end')"
      />
    </div>

    <div>
      <input
        v-model="text"
        spellcheck="false"
        aria-label="CSS colour"
        class="h-7 w-full rounded-md bg-input px-2 font-mono text-[11px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="textError && 'ring-2 ring-destructive/70'"
        @keydown.enter.prevent="typed"
        @blur="typed"
      >
      <p
        v-if="textError"
        class="mt-1 text-[11px] leading-snug text-destructive"
      >
        {{ textError }}
      </p>
    </div>

    <div class="flex items-center justify-between text-[11px]">
      <span
        class="rounded-sm bg-input px-1.5 py-0.5 text-muted-foreground"
        :class="gamut === 'sRGB' ? '' : 'text-amber-300'"
      >{{ gamut }}</span>
      <span class="flex items-center gap-1.5 text-muted-foreground">
        <span class="tabular">{{ contrast.toFixed(2) }}:1</span>
        <span
          class="rounded-sm px-1 py-0.5 font-medium"
          :class="contrast >= 4.5 ? 'bg-emerald-400/15 text-emerald-300' : contrast >= 3 ? 'bg-amber-400/15 text-amber-300' : 'bg-input text-muted-foreground'"
        >
          {{ contrast >= 7 ? 'AAA' : contrast >= 4.5 ? 'AA' : contrast >= 3 ? 'AA large' : 'Low' }}
        </span>
        <span>vs text</span>
      </span>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-[11px] text-muted-foreground">Harmonies</span>
      <div class="flex gap-1">
        <Tip
          v-for="(harmony, i) in harmonies"
          :key="i"
          :label="`Add ${harmony.label.toLowerCase()} to palette`"
        >
          <button
            class="size-5 rounded-full ring-1 ring-panel-border transition-transform hover:scale-115"
            :style="{ background: harmony.css }"
            :aria-label="`Add ${harmony.label}`"
            @click="emit('add', harmony.css)"
          />
        </Tip>
      </div>
    </div>
  </div>
</template>
