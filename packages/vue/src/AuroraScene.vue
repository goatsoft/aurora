<script setup lang="ts">
import { provide } from 'vue'
import { SCENE } from './scene'

/**
 * Puts every `<AuroraBackground>` inside it into one scene: one clock and one continuous field
 * across separate panels. Renders no element of its own.
 */
defineOptions({ name: 'AuroraScene' })

const props = defineProps<{ name: string }>()
provide(SCENE, () => props.name)
</script>

<template>
  <slot />
</template>
