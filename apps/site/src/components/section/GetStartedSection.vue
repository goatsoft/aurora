<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { SITE } from '@/head'
import { northernLights } from '@/lib/scenes'
</script>

<template>
  <section class="mx-auto max-w-6xl px-6 py-12 sm:py-16">
    <div
      v-reveal
      class="relative isolate overflow-hidden rounded-3xl border border-white/10 px-6 py-20 text-center"
    >
      <div class="absolute inset-0 -z-10">
        <AuroraBackground :src="northernLights" />
      </div>
      <EditInStudio
        :src="northernLights"
        position="top-4 right-4"
      />
      <div class="absolute inset-0 -z-10 bg-background/40" />
      <h2 class="mx-auto max-w-2xl text-heading font-semibold tracking-tight text-balance">
        Try it on your site
      </h2>
      <p class="mx-auto mt-4 max-w-xl text-lead text-pretty text-white/80">
        MIT licensed. Works with Vue or plain HTML.
      </p>
      <div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
          as="a"
          :href="SITE.repo"
          target="_blank"
          rel="noopener"
        >
          <ISiGithub /> View on GitHub
        </Button>
        <Button
          size="lg"
          variant="glass"
          as="a"
          :href="SITE.npm"
          target="_blank"
          rel="noopener"
        >
          <ISiNpm /> View on npm
        </Button>
      </div>
    </div>
  </section>
</template>
