<script setup lang="ts">
import { AuroraBackground, AuroraScene } from '@goatsoft/aurora-vue'
import hero from '~/presets/goat/hero.aurora'
import pillarBlue from '~/presets/goat/pillar-blue.aurora'
import pillarIndigo from '~/presets/goat/pillar-indigo.aurora'
import pillarViolet from '~/presets/goat/pillar-violet.aurora'

const pillars = [
  { title: 'Blue', src: pillarBlue },
  { title: 'Violet', src: pillarViolet },
  { title: 'Indigo', src: pillarIndigo },
]
</script>

<template>
  <main>
    <section class="hero">
      <AuroraBackground v-slot="{ mode }" :src="hero">
        <span class="badge">{{ mode }}</span>
      </AuroraBackground>
      <h1>Aurora</h1>
      <p>WebGPU backgrounds with a CSS fallback, imported as <code>.aurora</code> files.</p>
    </section>

    <AuroraScene name="pillars">
      <div class="pillars">
        <article v-for="pillar in pillars" :key="pillar.title">
          <AuroraBackground :src="pillar.src" />
          <h2>{{ pillar.title }}</h2>
        </article>
      </div>
    </AuroraScene>
  </main>
</template>

<style>
body { margin: 0; background: #07060f; color: #eef; font: 16px/1.5 system-ui, sans-serif }
.hero { position: relative; isolation: isolate; min-height: 60vh; display: grid; place-content: center; text-align: center }
.hero h1 { font-size: clamp(3rem, 10vw, 7rem); margin: 0 }
.badge { position: absolute; right: 1rem; bottom: 1rem; font: 12px ui-monospace, monospace; opacity: 0.6 }
.pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 2rem }
.pillars article { position: relative; isolation: isolate; height: 16rem; border-radius: 1rem; overflow: hidden; display: grid; place-content: end start; padding: 1.5rem }
</style>
