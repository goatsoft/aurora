<script setup lang="ts">
import type { AuroraModule } from '@goatsoft/aurora'
import type { AuroraDocument } from '@goatsoft/aurora-format'

defineProps<{ src: AuroraModule | AuroraDocument, label?: string }>()
</script>

<template>
  <div
    role="group"
    aria-label="Background controls"
    class="absolute z-10 flex items-center gap-2"
  >
    <PlaybackToggle />
    <EditInStudio
      :src="src"
      :label="label ?? ('doc' in src ? src.doc : src).name"
      inline
    />
  </div>
</template>
