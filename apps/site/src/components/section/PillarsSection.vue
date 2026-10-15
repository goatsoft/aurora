<script setup lang="ts">
const pillars = [
  { icon: 'motion', title: 'Reduced motion & pause', body: 'Honours prefers-reduced-motion. Pause animation while keeping pointer and keyboard responses.' },
  { icon: 'layers', title: 'Layers & interactions', body: 'Combine auroras, landscapes and effects with responses to movement, taps and drags.' },
  { icon: 'studio', title: 'Visual editing in Studio', body: 'Edit, undo and share. Preview on light or dark pages.' },
  { icon: 'css', title: 'CSS fallback and SSR', body: 'A CSS gradient appears immediately, including on server-rendered pages and browsers without WebGPU.' },
  { icon: 'gpu', title: 'Pauses out of view', body: 'Off-screen and hidden tabs stop drawing. All backgrounds share one GPU device.' },
  { icon: 'colour', title: 'Shared backgrounds', body: 'One continuous scene across panels, with OKLab colour and Display P3 support.' },
]
</script>

<template>
  <section
    id="features"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-10 sm:py-16"
  >
    <div
      v-reveal
    >
      <p class="eyebrow">
        Features
      </p>
      <h2 class="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        Build, preview and control <span class="text-muted-foreground">your backgrounds.</span>
      </h2>
    </div>
    <div class="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="(pillar, i) in pillars"
        :key="pillar.title"
        v-reveal="i * 90"
        class="grid grid-cols-[2rem_minmax(0,1fr)] content-start gap-x-3 gap-y-1 border-t border-border pt-4"
      >
        <div class="row-span-2 grid size-8 place-items-center rounded-lg bg-linear-to-br from-spectrum-1/25 to-spectrum-2/25 text-foreground ring-1 ring-white/10">
          <IHgCpu
            v-if="pillar.icon === 'gpu'"
            class="size-4"
          />
          <IHgPaintBrush04
            v-else-if="pillar.icon === 'css'"
            class="size-4"
          />
          <IHgPause
            v-else-if="pillar.icon === 'motion'"
            class="size-4"
          />
          <IHgLayers01
            v-else-if="pillar.icon === 'layers'"
            class="size-4"
          />
          <IHgPaintBoard
            v-else-if="pillar.icon === 'studio'"
            class="size-4"
          />
          <IHgColors
            v-else
            class="size-4"
          />
        </div>
        <h3 class="text-base font-semibold">
          {{ pillar.title }}
        </h3>
        <p class="text-sm/relaxed text-pretty text-muted-foreground">
          {{ pillar.body }}
        </p>
      </article>
    </div>
  </section>
</template>
