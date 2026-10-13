<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { useHead } from '@/head'
import { polarNight } from '@/lib/scenes'

useHead({ title: 'Not found', description: 'There is nothing at this address.' })
</script>

<template>
  <main class="relative isolate grid min-h-dvh place-items-center overflow-hidden px-6 text-center">
    <div class="absolute inset-0 -z-10">
      <AuroraBackground :src="polarNight" />
    </div>
    <div>
      <p class="eyebrow">
        404
      </p>
      <h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
        Page not found
      </h1>
      <p class="mx-auto mt-4 max-w-md text-lg text-pretty text-white/75">
        Nothing lives at this address. Try the home page or the docs.
      </p>
      <div class="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Button as-child>
          <RouterLink to="/">
            <IHgHome01 /> Home
          </RouterLink>
        </Button>
        <Button
          variant="glass"
          as-child
        >
          <RouterLink to="/docs">
            <IHgBook02 /> Documentation
          </RouterLink>
        </Button>
      </div>
    </div>
  </main>
</template>
