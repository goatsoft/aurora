<script setup lang="ts">
import type { AuroraModule } from '@goatsoft/aurora'
import { AuroraBackground } from '@goatsoft/aurora-vue'

const starters = import.meta.glob<AuroraModule>('~/presets/starters/*.aurora', { eager: true, import: 'default' })
const starter = (id: string) => Object.entries(starters).find(([path]) => path.endsWith(`/${id}.aurora`))![1]

const cards = [
  { id: 'aurora-fbm', name: 'Aurora', kind: 'The flagship', body: 'Ribbons of light from domain-warped noise.', span: 'md:col-span-2' },
  { id: 'starfield', name: 'Starfield', kind: 'Night sky', body: 'Twinkling stars, a milky way, the odd meteor.', span: '' },
  { id: 'mountains', name: 'Mountains', kind: 'Earth', body: 'Ridges fading into haze, with valley mist.', span: '' },
  { id: 'clouds', name: 'Clouds', kind: 'Air', body: 'Sunlit cumulus drifting across an open sky.', span: '' },
  { id: 'fire', name: 'Fire', kind: 'Fire', body: 'Flames licking up, embers rising.', span: '' },
  { id: 'water', name: 'Water', kind: 'Water', body: 'Sunlight caustics over deep, clear water.', span: '' },
  { id: 'strata', name: 'Strata', kind: 'Earth', body: 'Sandstone layers, folded and carved by wind.', span: '' },
  { id: 'wind', name: 'Wind', kind: 'Air', body: 'Silky streaks of air, bent by gusts.', span: '' },
  { id: 'mesh-gradient', name: 'Mesh gradient', kind: 'Gradients', body: 'Four colour fields, drifting together.', span: 'md:col-span-2' },
  { id: 'conic', name: 'Conic', kind: 'Gradients', body: 'Colours turning slowly around a point.', span: '' },
].map((card) => ({ ...card, scene: starter(card.id) }))
</script>

<template>
  <section
    id="elements"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
  >
    <div
      v-reveal
      class="max-w-2xl"
    >
      <p class="eyebrow">
        Generators
      </p>
      <h2 class="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Auroras, and the elements.
      </h2>
      <p class="mt-4 text-lg text-pretty text-muted-foreground">
        Twelve generators ship built in, each art-directed so it looks right untouched. Layer them, blend them, mask them. Every card here is running live.
      </p>
    </div>
    <div class="mt-12 grid auto-rows-60 gap-4 md:grid-cols-3">
      <RouterLink
        v-for="(card, i) in cards"
        :key="card.id"
        v-reveal="(i % 3) * 80"
        :to="`/docs/generators/${card.id}`"
        class="group relative isolate overflow-hidden rounded-2xl border border-white/10 bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="card.span"
      >
        <div class="absolute inset-0 -z-10 transition-transform duration-700 group-hover:scale-105">
          <AuroraBackground :src="card.scene" />
        </div>
        <div class="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-linear-to-t from-background/90 to-transparent" />
        <div class="flex h-full flex-col justify-end p-5">
          <p class="font-mono text-[11px] tracking-[0.18em] text-white/70 uppercase">
            {{ card.kind }}
          </p>
          <h3 class="mt-1 text-xl font-semibold">
            {{ card.name }}
          </h3>
          <p class="mt-1 text-sm text-white/75">
            {{ card.body }}
          </p>
        </div>
      </RouterLink>
    </div>
  </section>
</template>
