<script setup lang="ts">
import mark from '~/assets/brand/aurora-auto.svg?url'
import compact from '~/assets/brand/favicon-auto.svg?url'

/** The Aurora mark: the neon variant from 48 px up, the compact one below (assets/brand/README.md). */
const props = defineProps<{ size: number }>()
</script>

<template>
  <img
    :src="props.size >= 48 ? mark : compact"
    :width="props.size"
    :height="props.size"
    alt=""
    draggable="false"
  >
</template>
