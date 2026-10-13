<script setup lang="ts">
import type { BadgeOptions } from '@goatsoft/aurora/badge'
import { auroraBadge } from '@goatsoft/aurora/badge'
import { computed } from 'vue'

/** Optional attribution. Brand artwork is hosted separately from this MIT component. */
defineOptions({ name: 'AuroraBadge' })
const props = defineProps<BadgeOptions>()
const badge = computed(() => auroraBadge(props))
</script>

<template>
  <a :href="badge.href">
    <img
      :src="badge.src"
      :alt="badge.alt"
      :width="badge.width"
      :height="badge.height"
      decoding="async"
    >
  </a>
</template>
