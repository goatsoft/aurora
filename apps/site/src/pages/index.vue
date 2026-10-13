<script setup lang="ts">
import { useHead } from '@/head'
import { polarNight } from '@/lib/scenes'

useHead({})
</script>

<template>
  <main>
    <HeroSection />
    <div
      v-reveal
      class="relative z-10 mx-auto -mt-28 max-w-5xl px-4 perspective-[1600px]"
    >
      <div class="pointer-events-none absolute -inset-x-10 -top-10 -z-10 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,oklch(0.65_0.18_290/0.35),transparent_70%)] blur-2xl" />
      <StudioWindow :scene="polarNight" />
    </div>
    <PillarsSection />
    <ElementsSection />
    <CodeSection />
    <StudioSection />
    <ScenesSection />
    <NumbersSection />
    <GetStartedSection />
  </main>
</template>
