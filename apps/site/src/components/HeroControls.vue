<script setup lang="ts">
import type { AuroraModule } from '@goatsoft/aurora'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import { useSitePreferences } from '@/lib/preferences'

defineProps<{ src: AuroraModule | AuroraDocument, label?: string }>()
const { paused, toggleMotion } = useSitePreferences()
</script>

<template>
  <div
    role="group"
    aria-label="Background controls"
    class="absolute z-10 flex items-center gap-2"
  >
    <button
      type="button"
      class="grid size-11 place-items-center rounded-full bg-black/35 text-white/85 ring-1 ring-white/15 backdrop-blur-md transition-colors outline-none hover:bg-black/55 hover:text-white focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
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
    <EditInStudio
      :src="src"
      :label="label ?? ('doc' in src ? src.doc : src).name"
      inline
    />
  </div>
</template>
