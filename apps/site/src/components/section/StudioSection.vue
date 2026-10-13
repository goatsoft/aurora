<script setup lang="ts">
import { goldenHour } from '@/lib/scenes'

const features = [
  'Controls generated from every generator\'s parameters, scrubbable, with ⇧ for big steps',
  'An OKLCH picker with sRGB and P3 gamut lines, contrast checks and harmonies',
  'WebGPU and CSS side by side, scored by how closely they match',
  'Undo, autosave and share links that carry the whole document',
  'Opens your project\'s files and saves them in place; your site hot-reloads',
]
</script>

<template>
  <section
    id="studio"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
  >
    <div class="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div v-reveal>
        <p class="eyebrow">
          Aurora Studio
        </p>
        <h2 class="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          A builder that keeps up with you.
        </h2>
        <p class="mt-4 text-lg text-pretty text-muted-foreground">
          Studio is a full-bleed live canvas with glass panels around it. Everything is one keystroke away; ⌘K lists it all.
        </p>
        <ul class="mt-8 space-y-3">
          <li
            v-for="feature in features"
            :key="feature"
            class="flex gap-3 text-sm text-pretty text-muted-foreground"
          >
            <IHgTick02 class="mt-0.5 size-4 shrink-0 text-primary" />{{ feature }}
          </li>
        </ul>
        <Button
          class="mt-10"
          as="a"
          href="/studio/"
        >
          <IHgPaintBoard /> Open Aurora Studio
        </Button>
      </div>
      <div
        v-reveal="120"
        class="perspective-[1600px]"
      >
        <StudioWindow
          :scene="goldenHour"
          class="lg:transform-[rotateY(-8deg)_rotateX(4deg)]"
        />
      </div>
    </div>
  </section>
</template>
