<script setup lang="ts">
import { goldenHour } from '@/lib/scenes'
</script>

<template>
  <section
    id="studio"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
  >
    <div class="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div v-reveal>
        <p class="eyebrow">
          The editor
        </p>
        <h2 class="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Aurora Studio
        </h2>
        <p class="mt-4 text-lg text-pretty text-muted-foreground">
          Adjust layers, colours and motion. Save a .aurora file for your site.
        </p>
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
