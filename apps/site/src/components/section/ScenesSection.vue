<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { goldenHour, northernLights, polarNight } from '@/lib/scenes'

const scenes = [
  { scene: polarNight, name: 'Polar night', body: 'Stars, an aurora, and the ridge.' },
  { scene: northernLights, name: 'Northern lights', body: 'A curtain of green over the sky.' },
  { scene: goldenHour, name: 'Golden hour', body: 'Clouds in the last light.' },
]
</script>

<template>
  <section
    id="scenes"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
  >
    <div
      v-reveal
      class="mx-auto max-w-2xl text-center"
    >
      <p class="eyebrow">
        Scenes
      </p>
      <h2 class="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Start from something beautiful.
      </h2>
      <p class="mt-4 text-lg text-pretty text-muted-foreground">
        Studio ships with art-directed scenes and a starter for every generator. Open one, make it yours.
      </p>
    </div>
    <div class="mt-12 grid gap-4 sm:grid-cols-3">
      <a
        v-for="(item, i) in scenes"
        :key="item.name"
        v-reveal="i * 80"
        href="/studio/"
        class="group overflow-hidden rounded-2xl border border-white/10 bg-surface/50 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div class="relative aspect-4/5 overflow-hidden"><AuroraBackground :src="item.scene" /></div>
        <div class="p-4">
          <h3 class="font-semibold">{{ item.name }}</h3>
          <p class="mt-0.5 text-sm text-muted-foreground">{{ item.body }}</p>
        </div>
      </a>
    </div>
  </section>
</template>
