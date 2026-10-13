<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { SITE } from '@/head'
import { polarNight } from '@/lib/scenes'
</script>

<template>
  <section class="relative isolate flex min-h-svh flex-col items-center overflow-hidden px-6 pt-32 pb-40 text-center sm:pt-40">
    <!-- The hero is itself an Aurora scene: stars, an aurora, and mountains on the horizon. -->
    <div class="absolute inset-0 -z-20">
      <AuroraBackground :src="polarNight" />
    </div>
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_50%_38%,oklch(0.13_0.025_272/0.55),transparent_70%)]" />
    <div class="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-linear-to-b from-transparent to-background" />

    <Mark
      :size="168"
      class="size-32 animate-mark-in mark-glow sm:size-40 md:size-44"
    />

    <h1 class="mt-8 max-w-4xl animate-rise text-5xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance [animation-delay:250ms] [text-shadow:0_2px_30px_oklch(0_0_0/0.5)] sm:text-7xl md:text-8xl">
      Backgrounds that<br><span class="text-spectrum">feel alive.</span>
    </h1>
    <p class="mx-auto mt-7 max-w-2xl animate-rise text-lg text-pretty text-muted-foreground [animation-delay:420ms] sm:text-xl">
      Aurora renders animated backgrounds on the GPU with WebGPU, and paints a matching CSS fallback in the very first frame, so nobody ever sees an empty box. Design one in Aurora Studio, drop it into any site.
    </p>
    <p class="mt-5 animate-rise text-sm text-muted-foreground [animation-delay:520ms]">
      Open source. Under 10 kB. Honours reduced motion. Works without WebGPU.
    </p>

    <div class="mt-9 flex animate-rise flex-col items-center gap-3 [animation-delay:620ms] sm:flex-row">
      <Button
        size="lg"
        as="a"
        href="/studio/"
      >
        <IHgPaintBoard /> Open Aurora Studio
      </Button>
      <Button
        size="lg"
        variant="glass"
        as-child
      >
        <RouterLink to="/docs">
          <IHgBookOpen01 /> Documentation
        </RouterLink>
      </Button>
      <Button
        size="lg"
        variant="glass"
        as="a"
        :href="SITE.repo"
        target="_blank"
        rel="noopener"
      >
        <ISiGithub /> Star on GitHub
      </Button>
    </div>
    <p class="mt-5 animate-rise font-mono text-xs text-muted-foreground/80 [animation-delay:800ms]">
      pnpm add @goatsoft/aurora @goatsoft/aurora-vue
    </p>
  </section>
</template>
