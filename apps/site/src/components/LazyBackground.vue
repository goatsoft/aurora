<script setup lang="ts">
import type { AuroraMode, AuroraModule } from '@goatsoft/aurora'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useSitePreferences } from '@/lib/preferences'

const props = defineProps<{ src: AuroraModule }>()
const emit = defineEmits<{ modeChange: [mode: AuroraMode] }>()
const host = ref<HTMLElement>()
const mounted = ref(false)
const css = computed(() => props.src.css.style)
// Off-screen cards keep their prerendered fallback. No surface means no generator downloads
// or pipeline compilation until the card approaches the viewport. The runtime handles pausing.
const { stop } = useIntersectionObserver(host, ([entry]) => {
  if (!entry?.isIntersecting) return
  mounted.value = true
  stop()
}, { rootMargin: '300px' })
function changed(value: AuroraMode) {
  emit('modeChange', value)
}

const { paused: sitePaused } = useSitePreferences()
</script>

<template>
  <div
    ref="host"
    class="absolute inset-0 overflow-hidden"
    aria-hidden="true"
  >
    <div
      v-if="!mounted"
      class="absolute inset-[-10%]"
      :style="css"
    />
    <AuroraBackground
      v-if="mounted"
      :paused="sitePaused"
      :src="src"
      @mode-change="changed"
    />
  </div>
</template>
