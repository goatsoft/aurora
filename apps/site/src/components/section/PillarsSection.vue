<script setup lang="ts">
const pillars = [
  { icon: 'motion', title: 'Reduced motion and playback', body: 'Honours prefers-reduced-motion. Pause and resume without restarting the animation; pointer and keyboard responses still work while paused.' },
  { icon: 'layers', title: 'Layered scenes and interactions', body: 'Layer auroras, landscapes, weather and gradients. Add scan lines, static or signal distortion, then make the scene respond to movement, taps and drags.' },
  { icon: 'studio', title: 'Visual editing in Studio', body: 'Edit colours, layers and interactions in your browser. Preview on light or dark pages, undo changes, and save or share your .aurora file.' },
  { icon: 'css', title: 'CSS fallback and SSR', body: 'A generated CSS gradient appears before WebGPU starts and stays available in browsers without it. Works with server-rendered pages.' },
  { icon: 'gpu', title: 'Pauses out of view', body: 'Backgrounds pause off-screen and in hidden tabs. Every background on the page shares one GPU device and a configurable frame budget.' },
  { icon: 'colour', title: 'Shared backgrounds', body: 'Carry a continuous background across separate cards or panels. Colours blend in OKLab, with sRGB and Display P3 support.' },
]
</script>

<template>
  <section
    id="features"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 sm:py-24"
  >
    <div
      v-reveal
      class="text-center"
    >
      <p class="eyebrow">
        Features
      </p>
      <h2 class="mx-auto mt-4 max-w-3xl text-heading font-semibold tracking-tight text-balance">
        Build, preview and control <span class="text-muted-foreground">your backgrounds.</span>
      </h2>
    </div>
    <div class="mt-14 grid gap-4 md:grid-cols-3">
      <article
        v-for="(pillar, i) in pillars"
        :key="pillar.title"
        v-reveal="i * 90"
        class="rounded-2xl p-6 glass"
      >
        <div class="grid size-11 place-items-center rounded-xl bg-linear-to-br from-spectrum-1/25 to-spectrum-2/25 text-foreground ring-1 ring-white/10">
          <IHgCpu
            v-if="pillar.icon === 'gpu'"
            class="size-5"
          />
          <IHgPaintBrush04
            v-else-if="pillar.icon === 'css'"
            class="size-5"
          />
          <IHgPause
            v-else-if="pillar.icon === 'motion'"
            class="size-5"
          />
          <IHgLayers01
            v-else-if="pillar.icon === 'layers'"
            class="size-5"
          />
          <IHgPaintBoard
            v-else-if="pillar.icon === 'studio'"
            class="size-5"
          />
          <IHgColors
            v-else
            class="size-5"
          />
        </div>
        <h3 class="mt-5 text-lg font-semibold">
          {{ pillar.title }}
        </h3>
        <p class="mt-2 text-sm/relaxed text-pretty text-muted-foreground">
          {{ pillar.body }}
        </p>
      </article>
    </div>
  </section>
</template>
