<script setup lang="ts">
import type { Component } from 'vue'
import IconStorm from '~icons/hugeicons/cloud-angled-rain-zap'
import IconNight from '~icons/hugeicons/moon-02'
import IconDay from '~icons/hugeicons/sun-03'
import { glacier, glacierNight, glacierStorm } from '@/lib/scenes'

/** The Studio picture under the hero: one landscape in three moods, switched live. */
const modes: { id: string, label: string, icon: Component, scene: typeof glacier, inspect: string }[] = [
  { id: 'day', label: 'Day', icon: IconDay, scene: glacier, inspect: 'mountains' },
  { id: 'night', label: 'Night', icon: IconNight, scene: glacierNight, inspect: 'curtain' },
  { id: 'storm', label: 'Storm', icon: IconStorm, scene: glacierStorm, inspect: 'lightning' },
]
const current = ref(modes[1]!)
</script>

<template>
  <StudioWindow
    :scene="current.scene"
    :inspect="current.inspect"
  >
    <template #controls>
      <div
        role="group"
        aria-label="Scene"
        class="flex gap-1 rounded-full bg-[oklch(0.13_0.012_270/0.8)] p-1 ring-1 ring-white/10 backdrop-blur-xl"
      >
        <button
          v-for="mode in modes"
          :key="mode.id"
          type="button"
          :aria-pressed="current.id === mode.id"
          class="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="current.id === mode.id ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:bg-white/8 hover:text-foreground'"
          @click="current = mode"
        >
          <component
            :is="mode.icon"
            class="size-4"
            aria-hidden="true"
          />{{ mode.label }}
        </button>
      </div>
    </template>
  </StudioWindow>
</template>
