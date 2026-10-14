<script setup lang="ts">
const pillars = [
  { icon: 'gpu', title: 'One GPU device per page', body: 'All the backgrounds on a page share one GPU device. They stop drawing when they scroll out of view or the tab is hidden.' },
  { icon: 'css', title: 'CSS gradient fallback', body: 'Each background also has a CSS gradient that approximates it. Browsers without WebGPU show the gradient.' },
  { icon: 'colour', title: 'Colour in OKLab', body: 'Colours blend in OKLab, so a gradient between two bright colours stays bright in the middle.' },
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
        How it works
      </p>
      <h2 class="mx-auto mt-4 max-w-3xl text-heading font-semibold tracking-tight text-balance">
        Uses WebGPU when available, <span class="text-muted-foreground">with a CSS fallback.</span>
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
