<script setup lang="ts">
import type { AuroraModule } from '@goatsoft/aurora'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { blueHour, glacierStorm, mistyForest } from '@/lib/scenes'

const starters = import.meta.glob<AuroraModule>('~/presets/starters/*.aurora', { eager: true, import: 'default' })
const starter = (id: string) => Object.entries(starters).find(([path]) => path.endsWith(`/${id}.aurora`))![1]

/** Cards that show their generator inside a scene rather than alone. */
const SCENES: Record<string, AuroraModule> = { mountains: blueHour, treeline: mistyForest, rain: glacierStorm }

const cards = [
  // Grouped by kind, in reading order; the wide cards keep every row of three full.
  { id: 'aurora-fbm', name: 'Aurora', kind: 'Aurora', body: 'Drifting ribbons of light. This is the original Aurora shader.', span: 'md:col-span-2' },
  { id: 'curtain', name: 'Curtain', kind: 'Aurora', body: 'Hanging curtains with rays that rise from a bright lower edge.', span: '' },
  { id: 'starfield', name: 'Starfield', kind: 'Night sky', body: 'Three depths of stars, a milky way and the odd meteor.', span: '' },
  { id: 'linear-gradient', name: 'Linear gradient', kind: 'Gradients', body: 'Two to four colours along an angle, like CSS linear-gradient().', span: '' },
  { id: 'conic', name: 'Conic', kind: 'Gradients', body: 'Colours turning slowly around a point.', span: '' },
  { id: 'mesh-gradient', name: 'Mesh gradient', kind: 'Gradients', body: 'Four colours that drift and blend.', span: 'md:col-span-2' },
  { id: 'clouds', name: 'Clouds', kind: 'Air', body: 'Cumulus at two depths, lit from one side.', span: '' },
  { id: 'rain', name: 'Rain', kind: 'Air', body: 'Rain in three depths, leaning with the wind. Shown here in a storm with lightning.', span: 'md:col-span-2' },
  { id: 'lightning', name: 'Lightning', kind: 'Air', body: 'Forked bolts and sky flashes, every few seconds.', span: '' },
  { id: 'wind', name: 'Wind', kind: 'Air', body: 'Thin streaks that bend in the gusts.', span: '' },
  { id: 'mountains', name: 'Mountains', kind: 'Earth', body: 'Ridges that fade into haze. Shown here over a linear gradient.', span: '' },
  { id: 'treeline', name: 'Treeline', kind: 'Earth', body: 'Rows of spruce silhouettes, fading into the mist behind them.', span: '' },
  { id: 'strata', name: 'Strata', kind: 'Earth', body: 'Folded sandstone layers.', span: '' },
  { id: 'water', name: 'Water', kind: 'Water', body: 'Light patterns on the floor of clear water.', span: '' },
  { id: 'fire', name: 'Fire', kind: 'Fire', body: 'Flames and rising embers.', span: '' },
].map((card) => ({ ...card, scene: SCENES[card.id] ?? starter(card.id) }))
</script>

<template>
  <section
    id="generators"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 sm:py-24"
  >
    <div
      v-reveal
      class="max-w-2xl"
    >
      <p class="eyebrow">
        Generators
      </p>
      <h2 class="mt-4 text-heading font-semibold tracking-tight text-balance">
        Every kind of atmosphere
      </h2>
      <p class="mt-4 text-lead text-pretty text-muted-foreground">
        Try the backgrounds below, or combine them in Studio.
      </p>
    </div>
    <div class="mt-12 grid auto-rows-60 gap-4 md:grid-cols-3">
      <!-- The card is a link to the generator's docs (its title's link covers the card); the pencil opens it in Studio. -->
      <div
        v-for="(card, i) in cards"
        :key="card.id"
        v-reveal="(i % 3) * 80"
        class="group relative isolate overflow-hidden rounded-2xl border border-white/10 bg-background focus-within:ring-2 focus-within:ring-ring"
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
            <RouterLink
              :to="`/docs/generators/${card.id}`"
              class="outline-none after:absolute after:inset-0"
            >
              {{ card.name }}
            </RouterLink>
          </h3>
          <p class="mt-1 text-sm text-white/75">
            {{ card.body }}
          </p>
        </div>
        <EditInStudio
          :src="card.scene"
          :label="card.name"
        />
      </div>
    </div>
  </section>
</template>
