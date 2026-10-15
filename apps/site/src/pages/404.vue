<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@/head'
import { useSitePreferences } from '@/lib/preferences'
import { polarNight } from '@/lib/scenes'

useHead({ title: 'Not found', description: 'There is nothing at this address.' })

const { paused: sitePaused } = useSitePreferences()
</script>

<template>
  <main
    id="main-content"
    tabindex="-1"
    class="relative isolate grid min-h-dvh place-items-center overflow-hidden px-6 text-center"
  >
    <div class="absolute inset-0 -z-10">
      <AuroraBackground
        :paused="sitePaused"
        :src="polarNight"
      />
    </div>
    <div class="rounded-3xl border border-border bg-background/95 p-8 sm:p-12">
      <p class="eyebrow">
        404
      </p>
      <h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
        Page not found
      </h1>
      <p class="mx-auto mt-4 max-w-md text-lg text-pretty text-muted-foreground">
        Nothing lives at this address. Try the home page or the docs.
      </p>
      <div class="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          :as="RouterLink"
          to="/"
        >
          <IHgHome01 /> Home
        </Button>
        <Button
          variant="glass"
          :as="RouterLink"
          to="/docs"
        >
          <IHgBook02 /> Documentation
        </Button>
      </div>
    </div>
  </main>
</template>
