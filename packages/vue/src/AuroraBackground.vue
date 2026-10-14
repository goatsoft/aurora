<script setup lang="ts">
import type { AuroraMode, AuroraSource } from '@goatsoft/aurora'
import { compileCss, FILL_STYLE, isAuroraModule } from '@goatsoft/aurora'
import { computed, onMounted, ref, watch } from 'vue'
import { useAurora } from './use-aurora'

/**
 * `<AuroraBackground :src="hero" />` fills its positioned parent with an Aurora background.
 *
 * `src` is an imported `.aurora` module (best: validated at build time, CSS inlined), a document,
 * or a URL. On the server it renders the CSS fallback, so the first paint already has the
 * background; in the browser WebGPU takes over without a flash. The default slot receives `mode`.
 */
defineOptions({ name: 'AuroraBackground' })

const props = defineProps<{
  src: AuroraSource | string
  /** Join a named scene (defaults to the nearest `<AuroraScene>`). */
  scene?: string
  /** Freeze the ambient animation at its current phase. */
  paused?: boolean
  /** A meaningful container for input, outside this decorative background. */
  interactionTarget?: HTMLElement | undefined
  /** Opt into pointer dragging, which reserves touch gestures on the input container. */
  drag?: boolean
  /** Preview reduced motion; the visitor's own preference always remains effective. */
  reducedMotion?: boolean
}>()
const emit = defineEmits<{
  modeChange: [mode: AuroraMode]
  error: [error: Error]
}>()
defineSlots<{ default?: (props: { mode: AuroraMode }) => unknown }>()

const host = ref<HTMLElement>()
const { mode, surface } = useAurora(host, () => props.src, {
  scene: () => props.scene,
  paused: () => props.paused,
  interactionTarget: () => props.interactionTarget,
  drag: () => props.drag,
  reducedMotion: () => props.reducedMotion,
  onError: (error) => emit('error', error),
})
watch(mode, (next) => emit('modeChange', next))
defineExpose({ mode, surface })

// Server and first client render: the fallback as plain CSS, so it is in the HTML.
const fallback = computed(() => {
  const { src } = props
  if (typeof src === 'string') return undefined
  return `position:absolute;inset:-10%;${(isAuroraModule(src) ? src.css : compileCss(src)).style}`
})
// An imported module's surface paints its precompiled fallback at once, so ours goes in the same
// task. For a plain document, the surface's fallback waits for its generators to load, so the
// server-rendered one stays until then: never none, never two.
const hydrated = ref(false)
onMounted(() => {
  if (typeof props.src !== 'string' && isAuroraModule(props.src)) {
    hydrated.value = true
    return
  }
  watch(surface, (current) => {
    void current?.ready.then(() => {
      if (surface.value === current) hydrated.value = true
    })
  }, { immediate: true })
})
</script>

<template>
  <div
    ref="host"
    class="aurora-background"
    aria-hidden="true"
    :style="FILL_STYLE"
    :data-aurora-ssr="hydrated ? undefined : ''"
  >
    <div
      v-if="!hydrated && fallback"
      :style="fallback"
    />
    <slot :mode="mode" />
  </div>
</template>
