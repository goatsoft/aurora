<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { RouterLink } from 'vue-router'
import { borealis } from '@/lib/scenes'
</script>

<template>
  <!--
    Fills the screen, plus the 7rem the Studio picture below overlaps it (index.vue), so the picture
    starts just below the fold and rises in as you scroll. The extra 7rem of bottom padding keeps the
    headline centred in the part on screen.
  -->
  <section class="relative isolate flex min-h-[calc(100svh+7rem)] flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-64 text-center sm:pb-68">
    <!-- The hero is itself an Aurora scene: aurora curtains, green at the horizon and magenta above, over a treeline. -->
    <div class="absolute inset-0 -z-20">
      <AuroraBackground :src="borealis" />
    </div>
    <EditInStudio
      :src="borealis"
      label="this background"
      position="right-6 bottom-60"
    />
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(65%_50%_at_50%_50%,oklch(0.12_0.03_300/0.72),transparent_75%)]" />
    <div class="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-linear-to-b from-transparent to-background" />

    <h1 class="max-w-5xl animate-rise text-display font-semibold tracking-[-0.03em] text-balance [animation-delay:120ms] [text-shadow:0_2px_30px_oklch(0_0_0/0.5)]">
      Give your site <span class="text-spectrum">atmosphere</span>.
    </h1>
    <p class="mx-auto mt-6 max-w-xl animate-rise text-lead text-pretty text-foreground/80 [animation-delay:240ms] [text-shadow:0_1px_12px_oklch(0_0_0/0.6)]">
      Beautiful backgrounds that move with you.
    </p>

    <div class="mt-8 flex animate-rise flex-wrap items-center justify-center gap-3 [animation-delay:360ms]">
      <Button
        size="lg"
        as="a"
        href="/studio/"
      >
        <IHgPaintBoard /> Open Studio
      </Button>
      <Button
        size="lg"
        variant="glass"
        :as="RouterLink"
        to="/docs/guide/getting-started"
      >
        <IHgBookOpen01 /> Get started
      </Button>
    </div>
    <p class="mt-5 animate-rise font-mono text-xs text-foreground/75 [animation-delay:480ms] [text-shadow:0_1px_8px_oklch(0_0_0/0.8)] sm:text-sm">
      pnpm add @goatsoft/aurora @goatsoft/aurora-vue
    </p>
  </section>
</template>
