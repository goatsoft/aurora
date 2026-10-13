<script setup lang="ts">
import { useStudio } from '@/editor/studio'

/**
 * Phones: one bar at the bottom. Layers and Edit open their panels as sheets above it (tap again,
 * or tap the canvas, to close); play/pause and the presets sit beside them.
 */
const studio = useStudio()
const { ui } = studio

const button = 'flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent aria-pressed:bg-accent aria-pressed:text-foreground [&_svg]:size-5'

function toggle(sheet: 'layers' | 'inspector') {
  ui.sheet = ui.sheet === sheet ? undefined : sheet
}
const layer = computed(() => {
  const l = studio.rendered.value.layers[ui.layer]
  return l ? studio.generator(l.type)?.label ?? l.type : 'Layer'
})
</script>

<template>
  <nav
    v-show="!ui.focus"
    aria-label="Studio"
    class="absolute inset-x-2 bottom-2 z-30 grid h-16 grid-cols-4 rounded-2xl glass p-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden"
  >
    <button
      type="button"
      :class="button"
      :aria-pressed="ui.sheet === 'layers'"
      @click="toggle('layers')"
    >
      <IHgLayers01 />
      <span>Layers</span>
    </button>
    <button
      type="button"
      :class="button"
      :aria-pressed="ui.sheet === 'inspector'"
      @click="toggle('inspector')"
    >
      <IHgPreferenceHorizontal />
      <span class="max-w-full truncate px-1">{{ layer }}</span>
    </button>
    <button
      type="button"
      :class="button"
      :aria-label="ui.playing ? 'Pause' : 'Play'"
      @click="ui.playing = !ui.playing"
    >
      <IHgPause v-if="ui.playing" />
      <IHgPlay v-else />
      <span>{{ ui.playing ? 'Pause' : 'Play' }}</span>
    </button>
    <button
      type="button"
      :class="button"
      @click="ui.gallery = true"
    >
      <IHgGridView />
      <span>Presets</span>
    </button>
  </nav>
</template>
