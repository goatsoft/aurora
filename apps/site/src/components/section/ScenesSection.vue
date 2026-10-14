<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { goldenHour, northernLights, polarNight } from '@/lib/scenes'

const scenes = [
  { scene: polarNight, name: 'Polar night', body: 'A teal and violet aurora over a mountain ridge.' },
  { scene: northernLights, name: 'Northern lights', body: 'Green curtains with rays rising into violet.' },
  { scene: goldenHour, name: 'Golden hour', body: 'Clouds lit by a low sun.' },
]
</script>

<template>
  <section
    id="scenes"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 sm:py-24"
  >
    <div
      v-reveal
      class="mx-auto max-w-2xl text-center"
    >
      <p class="eyebrow">
        Scenes
      </p>
      <h2 class="mt-4 text-heading font-semibold tracking-tight text-balance">
        Ready-made scenes
      </h2>
      <p class="mt-4 text-lead text-pretty text-muted-foreground">
        Studio includes multi-layer scenes and a starter file for every generator. Open one and change it.
      </p>
    </div>
    <div class="mt-12 grid gap-4 sm:grid-cols-3">
      <div
        v-for="(item, i) in scenes"
        :key="item.name"
        v-reveal="i * 80"
        class="group relative overflow-hidden rounded-2xl border border-white/10 bg-surface/50"
      >
        <div class="relative aspect-4/5 overflow-hidden">
          <AuroraBackground :src="item.scene" />
        </div>
        <div class="p-4">
          <h3 class="font-semibold">
            {{ item.name }}
          </h3>
          <p class="mt-0.5 text-sm text-muted-foreground">
            {{ item.body }}
          </p>
        </div>
        <EditInStudio
          :src="item.scene"
          :label="item.name"
        />
      </div>
    </div>
  </section>
</template>
