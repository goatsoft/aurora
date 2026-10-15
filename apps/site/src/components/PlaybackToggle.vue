<script setup lang="ts">
import { useSitePreferences } from '@/lib/preferences'

const { paused, toggleMotion } = useSitePreferences()
</script>

<template>
  <button
    type="button"
    class="grid size-11 place-items-center rounded-full bg-black/65 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors outline-none hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
    :aria-label="paused ? 'Resume animations' : 'Pause animations'"
    :title="paused ? 'Resume animations' : 'Pause animations'"
    :aria-pressed="paused"
    @click="toggleMotion"
  >
    <IHgPlay
      v-if="paused"
      aria-hidden="true"
    />
    <IHgPause
      v-else
      aria-hidden="true"
    />
  </button>
</template>
