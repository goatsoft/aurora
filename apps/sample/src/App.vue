<script setup lang="ts">
import { AuroraBackground, AuroraScene } from '@goatsoft/aurora-vue'
import hero from '~/presets/classic/hero.aurora'
import pillarBlue from '~/presets/classic/pillar-blue.aurora'
import pillarIndigo from '~/presets/classic/pillar-indigo.aurora'
import pillarViolet from '~/presets/classic/pillar-violet.aurora'

const pillars = [
  { title: 'Blue', src: pillarBlue },
  { title: 'Violet', src: pillarViolet },
  { title: 'Indigo', src: pillarIndigo },
]
</script>

<template>
  <main class="min-h-dvh bg-[#07060f] font-sans text-indigo-50">
    <section class="relative isolate grid min-h-[60vh] place-content-center text-center">
      <AuroraBackground
        v-slot="{ mode }"
        :src="hero"
      >
        <span class="absolute right-4 bottom-4 font-mono text-xs opacity-60">{{ mode }}</span>
      </AuroraBackground>
      <h1 class="text-[clamp(3rem,10vw,7rem)] font-semibold tracking-tight">
        Aurora
      </h1>
      <p>WebGPU backgrounds with a CSS fallback, imported as <code>.aurora</code> files.</p>
    </section>

    <AuroraScene name="pillars">
      <div class="grid grid-cols-3 gap-4 p-8">
        <article
          v-for="pillar in pillars"
          :key="pillar.title"
          class="relative isolate flex h-64 flex-col justify-end overflow-hidden rounded-2xl p-6"
        >
          <AuroraBackground :src="pillar.src" />
          <h2 class="text-xl font-medium">
            {{ pillar.title }}
          </h2>
        </article>
      </div>
    </AuroraScene>
  </main>
</template>
