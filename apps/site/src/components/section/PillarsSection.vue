<script setup lang="ts">
const pillars = [
  { icon: 'gpu', title: 'WebGPU, done right', body: 'One device and one shader per layer stack, rendered in a worker where it can be. It pauses off-screen and in background tabs, and keeps to a frame budget.' },
  { icon: 'css', title: 'Never a blank box', body: 'Every background compiles to a CSS fallback that paints in the first frame. WebGPU crossfades in only once a real frame is on screen; without it, the CSS stays.' },
  { icon: 'colour', title: 'Colour in OKLab', body: 'Palettes are authored in OKLCH and blended in OKLab, so gradients stay vivid through the middle. Display P3 where the screen has it, gamut-mapped where it doesn\'t.' },
]
</script>

<template>
  <section
    id="features"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
  >
    <div
      v-reveal
      class="text-center"
    >
      <p class="eyebrow">
        Built for the web you have
      </p>
      <h2 class="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Fast on the GPU. <span class="text-muted-foreground">Graceful everywhere else.</span>
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
