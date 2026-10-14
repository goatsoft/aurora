<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { lagoon, northernLights } from '@/lib/scenes'
import deepScan from '~/presets/scenes/deep-scan.aurora'
import ghostTerminal from '~/presets/scenes/ghost-terminal.aurora'

const scenes = [
  { scene: northernLights, name: 'Northern lights', kind: 'Aurora', group: 'aurora', body: 'Luminous green curtains rising into a violet sky.' },
  { scene: lagoon, name: 'Lagoon', kind: 'Elements', group: 'elements', body: 'Sunlight dancing through clear, turquoise water.' },
  { scene: ghostTerminal, name: 'Ghost terminal', kind: 'Tech', group: 'tech', body: 'Falling glyphs and a whisper of electronic interference.' },
  { scene: deepScan, name: 'Deep scan', kind: 'Tech', group: 'tech', body: 'A cyan radar sweep and quiet echoes in the dark.' },
]
</script>

<template>
  <section
    id="generators"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 sm:py-24"
  >
    <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div
        v-reveal
        class="max-w-2xl"
      >
        <p class="eyebrow">
          Selected backgrounds
        </p>
        <h2 class="mt-4 text-heading font-semibold tracking-tight text-balance">
          A little atmosphere. A different world.
        </h2>
        <p class="mt-4 text-lead text-pretty text-muted-foreground">
          A few of our favourites. Start with a finished scene, then make it your own.
        </p>
      </div>
      <RouterLink
        to="/gallery"
        class="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Explore the gallery <span aria-hidden="true">→</span>
      </RouterLink>
    </div>
    <div class="mt-10 grid gap-4 sm:grid-cols-2">
      <article
        v-for="item in scenes"
        :key="item.name"
        class="group relative overflow-hidden rounded-2xl border border-white/10 bg-surface/50"
      >
        <div class="relative aspect-16/10 overflow-hidden">
          <AuroraBackground :src="item.scene" />
        </div>
        <div class="p-5">
          <p class="eyebrow">
            {{ item.kind }}
          </p>
          <h3 class="mt-2 text-xl font-semibold">
            {{ item.name }}
          </h3>
          <p class="mt-2 text-sm text-muted-foreground">
            {{ item.body }}
          </p>
          <RouterLink
            :to="`/gallery#${item.group}`"
            class="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Explore {{ item.kind }}
          </RouterLink>
        </div>
        <EditInStudio
          :src="item.scene"
          :label="item.name"
        />
      </article>
    </div>
  </section>
</template>
