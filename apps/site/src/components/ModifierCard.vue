<script setup lang="ts">
import type { AuroraMode, AuroraModule } from '@goatsoft/aurora'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { computed, ref } from 'vue'
import { useStudioHref } from '@/lib/studio-link'

/**
 * A modifier shown as a before and after: the original scene on the left of the divider, the
 * same scene with its modifiers on the right. Drag the divider (or use the arrow keys) to
 * compare, as in Studio's split view. The comparison needs WebGPU: the CSS fallback has no
 * modifiers, so without it the card shows the fallback alone.
 */
const props = defineProps<{ name: string, body: string, scene: AuroraModule }>()
const beforeMode = ref<AuroraMode>('css')
const afterMode = ref<AuroraMode>('css')
const live = computed(() => beforeMode.value === 'webgpu' && afterMode.value === 'webgpu')
const original = computed(() => {
  const { modifiers: _, ...doc } = props.scene.doc
  return doc
})
const href = useStudioHref(() => props.scene)

// The stylesheet emits the allowed positions; the comparison needs no inline styles.
const split = ref(50)
const clip = computed(() => `[clip-path:inset(0_0_0_${split.value}%)]`)
const position = computed(() => `left-[${split.value}%]`)
const dragging = ref(false)
let grip = 0
function start(event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement
  const rect = handle.parentElement!.getBoundingClientRect()
  grip = event.clientX - rect.left - rect.width * split.value / 100
  handle.setPointerCapture(event.pointerId)
  dragging.value = true
}
function drag(event: PointerEvent) {
  if (!dragging.value) return
  const rect = (event.currentTarget as HTMLElement).parentElement!.getBoundingClientRect()
  if (rect.width) split.value = Math.min(95, Math.max(5, Math.round((event.clientX - grip - rect.left) / rect.width * 100)))
}
function nudge(event: KeyboardEvent) {
  const step = event.shiftKey ? 10 : 2
  if (event.key === 'ArrowLeft') split.value = Math.max(5, split.value - step)
  else if (event.key === 'ArrowRight') split.value = Math.min(95, split.value + step)
  else if (event.key === 'Home') split.value = 5
  else if (event.key === 'End') split.value = 95
  else return
  event.preventDefault()
}
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-white/10 bg-surface/50">
    <div class="relative aspect-16/10 overflow-hidden">
      <AuroraBackground
        :src="original"
        @mode-change="(value) => beforeMode = value"
      />
      <div
        class="absolute inset-0"
        :class="live ? clip : 'opacity-0'"
      >
        <AuroraBackground
          :src="scene"
          @mode-change="(value) => afterMode = value"
        />
      </div>
      <template v-if="live">
        <div
          role="slider"
          tabindex="0"
          :aria-label="`Compare the original scene with ${name}`"
          aria-valuemin="5"
          aria-valuemax="95"
          :aria-valuenow="split"
          :aria-valuetext="`${split}% original`"
          class="absolute inset-y-0 z-10 w-11 -translate-x-1/2 cursor-ew-resize touch-none outline-none focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-ring"
          :class="position"
          @pointerdown="start"
          @pointermove="drag"
          @pointerup="dragging = false"
          @pointercancel="dragging = false"
          @lostpointercapture="dragging = false"
          @keydown="nudge"
        >
          <div class="mx-auto h-full w-px bg-white/80 shadow-[0_0_12px_oklch(0_0_0/0.5)]" />
          <span class="absolute top-1/2 left-1/2 grid size-8 -translate-1/2 place-items-center rounded-full bg-black/55 text-white ring-1 ring-white/25 backdrop-blur-md">
            <IHgArrowLeftRight
              class="size-4"
              aria-hidden="true"
            />
          </span>
        </div>
        <p class="pointer-events-none absolute top-3 left-3 rounded-full bg-black/55 px-3 py-1.5 font-mono text-xs text-white ring-1 ring-white/15">
          Original
        </p>
        <p class="pointer-events-none absolute top-3 right-3 rounded-full bg-black/55 px-3 py-1.5 font-mono text-xs text-white ring-1 ring-white/15">
          {{ name }}
        </p>
      </template>
      <p
        v-else
        class="absolute top-3 left-3 rounded-full bg-black/55 px-3 py-1.5 font-mono text-xs text-white ring-1 ring-white/15"
        title="Live comparison uses WebGPU"
      >
        CSS fallback
      </p>
    </div>
    <div class="p-5">
      <h3 class="text-xl font-semibold">
        {{ name }}
      </h3>
      <p class="mt-3 text-sm/relaxed text-muted-foreground">
        {{ body }}
      </p>
      <a
        :href="href"
        :aria-label="`Open ${name} example in Studio`"
        class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >Open in Studio <span aria-hidden="true">↗</span></a>
    </div>
  </article>
</template>
