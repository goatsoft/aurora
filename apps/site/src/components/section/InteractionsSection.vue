<script setup lang="ts">
import { interactionCards } from '@/lib/interactions'
</script>

<template>
  <section
    id="interactions"
    aria-labelledby="interactions-title"
    class="scroll-mt-24 pt-16 sm:pt-24"
  >
    <div class="mb-8 border-t border-border pt-6">
      <p class="eyebrow">
        Responsive scenes
      </p>
      <h2
        id="interactions-title"
        class="mt-3 text-heading font-semibold tracking-tight"
      >
        Interactions
      </h2>
      <p class="mt-3 max-w-2xl text-muted-foreground">
        Follow the light, emit a pulse, or pull a signal apart. These scenes combine reusable input modules with the generators and modifiers you already know.
      </p>
      <RouterLink
        to="/docs/guide/interactions"
        class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Build an interaction <span aria-hidden="true">↗</span>
      </RouterLink>
    </div>
    <div class="grid gap-5 md:grid-cols-2">
      <InteractionPlayground
        v-for="card in interactionCards"
        :key="card.id"
        :scene="card.scene"
        :kind="card.kind"
        :body="card.body"
      />
    </div>
  </section>
</template>
