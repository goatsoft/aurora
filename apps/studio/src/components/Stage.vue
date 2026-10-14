<script setup lang="ts">
import type { AuroraMode } from '@goatsoft/aurora'
import { compileCss, DRIFT_KEYFRAMES } from '@goatsoft/aurora'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { useCompact } from '@/editor/layout'
import { DEFAULT_COPY, useStudio, VIEWPORTS } from '@/editor/studio'

/**
 * The live canvas: the page context behind everything, and the document in a frame sized to the
 * chosen viewport, scaled to fit between the panels. "Full page" fills the stage and scrolls, so
 * fixed backgrounds and parallax can be judged for real.
 */
const studio = useStudio()
const { ui } = studio
const compact = useCompact()

const area = ref<HTMLElement>()
const { width: areaWidth, height: areaHeight } = useElementSize(area)
const frame = computed(() => {
  const vp = VIEWPORTS[ui.viewport]
  if (!vp.width) return undefined
  // Phones: the background fills the space between the bars, at the phone's own size.
  if (compact.value) return { width: Math.max(1, areaWidth.value), height: Math.max(1, areaHeight.value), scale: 1 }
  const scale = Math.min(1, areaWidth.value / vp.width, areaHeight.value / vp.height)
  return { width: vp.width, height: vp.height, scale: Number.isFinite(scale) && scale > 0 ? scale : 1 }
})

const css = computed(() => compileCss(studio.preview.value))
const cssStyle = computed(() => {
  const { style, drift } = css.value
  const animate = drift > 0 && !ui.reducedMotion
  return `position:absolute;inset:-10%;${style}${animate ? `;animation:aurora-drift ${drift}s ease-in-out infinite;animation-play-state:${ui.playing ? 'running' : 'paused'}` : ''}`
})
const gpuMode = ref<AuroraMode>('css')
// Only say there's no WebGPU once it has had time to start.
const settled = refDebounced(gpuMode, 1500)

onMounted(() => {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(DRIFT_KEYFRAMES)
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
})

// Split view: drag the divider; CSS is on the right of it.
const splitting = ref(false)
function splitDrag(event: PointerEvent) {
  const host = (event.currentTarget as HTMLElement).parentElement!
  const rect = host.getBoundingClientRect()
  ui.split = Math.min(0.95, Math.max(0.05, (event.clientX - rect.left) / rect.width))
}

const page = computed(() => (ui.page === 'dark'
  ? 'bg-[oklch(0.13_0.02_270)] text-[oklch(0.96_0.01_270)]'
  : 'bg-[oklch(0.985_0.004_270)] text-[oklch(0.2_0.02_270)]'))
</script>

<template>
  <div
    class="absolute inset-0 transition-colors duration-500"
    :class="page"
  >
    <!-- Full page: the document is the page's own background, with content scrolling over it. -->
    <div
      v-if="!frame"
      class="absolute inset-0 overflow-y-auto"
      @scroll="(e) => (ui.scroll = (e.target as HTMLElement).scrollTop)"
    >
      <div class="relative min-h-[260vh]">
        <AuroraBackground
          v-if="ui.preview !== 'css'"
          :src="studio.preview.value"
          :paused="!ui.playing"
          @mode-change="(m) => (gpuMode = m)"
        />
        <div
          v-else
          class="absolute inset-0 overflow-hidden"
        >
          <div :style="cssStyle" />
        </div>
        <div class="relative mx-auto flex max-w-3xl flex-col gap-[40vh] px-8 pt-[28vh] pb-[30vh]">
          <section
            v-for="n in 3"
            :key="n"
            class="flex flex-col gap-3"
          >
            <p class="text-xs font-medium tracking-widest uppercase opacity-60">
              Section {{ n }}
            </p>
            <h2 class="text-5xl font-semibold tracking-tight text-balance">
              {{ n === 1 ? ui.copy.headline : ['Content scrolls over the background.', 'Check how text reads at every point.'][n - 2] }}
            </h2>
            <p class="max-w-xl text-base opacity-70">
              {{ n === 1 ? ui.copy.body : 'A fixed background stays where it is as you scroll; with parallax it moves more slowly than the page.' }}
            </p>
          </section>
        </div>
      </div>
    </div>

    <!-- Framed viewports, centred in the space between the panels. -->
    <div
      v-else
      ref="area"
      class="absolute grid place-items-center transition-[inset] duration-500 ease-[cubic-bezier(0.2,0.9,0.1,1)]"
      :class="ui.focus ? 'inset-4' : 'top-20 right-[340px] bottom-24 left-[300px] max-md:inset-x-2 max-md:top-16 max-md:bottom-19'"
      @click.self="ui.sheet = undefined"
    >
      <div
        class="relative shrink-0 overflow-hidden rounded-[18px] shadow-[0_0_0_1px_oklch(1_0_0/0.08),0_30px_80px_-20px_oklch(0_0_0/0.65)] transition-[width,height] duration-500 ease-[cubic-bezier(0.2,0.9,0.1,1)]"
        :class="page"
        :style="{ width: `${frame.width * frame.scale}px`, height: `${frame.height * frame.scale}px` }"
      >
        <div
          class="absolute top-0 left-0 origin-top-left"
          :style="{ width: `${frame.width}px`, height: `${frame.height}px`, transform: `scale(${frame.scale})` }"
        >
          <AuroraBackground
            v-if="ui.preview !== 'css'"
            :src="studio.preview.value"
            :paused="!ui.playing"
            @mode-change="(m) => (gpuMode = m)"
          />
          <div
            v-if="ui.preview !== 'webgpu'"
            class="absolute inset-0 overflow-hidden"
            :style="ui.preview === 'split' ? { clipPath: `inset(0 0 0 ${ui.split * 100}%)` } : undefined"
          >
            <div :style="cssStyle" />
          </div>
          <!-- Sample copy to judge legibility against. Click any of it to write your own. -->
          <div
            class="pointer-events-none relative flex h-full flex-col justify-center gap-4 px-[8%]"
            :class="[(ui.viewport === 'tile' || compact) && 'items-center text-center', compact && 'gap-3 px-6']"
            @click.self="ui.sheet = undefined"
          >
            <p class="text-sm font-medium tracking-widest uppercase opacity-60">
              {{ studio.doc.value.name }}
            </p>
            <EditableText
              v-model="ui.copy.headline"
              as="h1"
              label="Sample headline"
              :fallback="DEFAULT_COPY.headline"
              class="max-w-[16ch] font-semibold tracking-tight text-balance"
              :class="compact ? 'text-4xl' : ui.viewport === 'hero' ? 'text-7xl' : 'text-5xl'"
            />
            <EditableText
              v-if="ui.viewport !== 'tile'"
              v-model="ui.copy.body"
              as="p"
              label="Sample paragraph"
              :fallback="DEFAULT_COPY.body"
              class="max-w-[42ch] text-pretty opacity-80"
              :class="compact ? 'text-base' : 'text-xl'"
            />
            <span
              v-if="ui.viewport !== 'tile'"
              class="mt-2 inline-flex w-fit rounded-full px-5 py-2.5 text-base font-semibold shadow-lg"
              :class="ui.page === 'dark' ? 'bg-white text-[oklch(0.15_0.02_270)]' : 'bg-[oklch(0.15_0.02_270)] text-white'"
            >
              <EditableText
                v-model="ui.copy.action"
                label="Sample button text"
                :fallback="DEFAULT_COPY.action"
              />
            </span>
          </div>
        </div>

        <template v-if="ui.preview === 'split'">
          <div
            class="absolute inset-y-0 z-10 w-6 -translate-x-1/2 cursor-ew-resize touch-none"
            :style="{ left: `${ui.split * 100}%` }"
            @pointerdown="(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); splitting = true }"
            @pointermove="(e) => splitting && splitDrag(e)"
            @pointerup="splitting = false"
          >
            <div class="mx-auto h-full w-px bg-white/80 shadow-[0_0_12px_oklch(0_0_0/0.5)]" />
            <div class="absolute top-1/2 left-1/2 grid size-7 -translate-1/2 place-items-center rounded-full glass">
              <IHgArrowLeftRight class="size-3.5" />
            </div>
          </div>
          <span class="absolute top-3 left-3 z-10 rounded-md glass px-2 py-0.5 text-[11px] font-medium text-foreground">WebGPU</span>
          <span class="absolute top-3 right-3 z-10 rounded-md glass px-2 py-0.5 text-[11px] font-medium text-foreground">CSS fallback</span>
        </template>
        <span
          v-else-if="ui.preview === 'webgpu' && gpuMode === 'css' && settled === 'css'"
          class="absolute right-3 bottom-3 z-10 flex items-center gap-1.5 rounded-md glass px-2 py-1 text-[11px] text-foreground"
        >
          <span class="size-1.5 animate-pulse rounded-full bg-amber-300" />
          Showing the CSS fallback: this browser has no WebGPU
        </span>
      </div>
    </div>
  </div>
</template>
