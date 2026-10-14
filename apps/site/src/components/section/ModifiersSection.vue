<script setup lang="ts">
import { modifierCards } from '@/lib/modifiers'

defineProps<{ embedded?: boolean }>()
</script>

<template>
  <section
    id="modifiers"
    aria-labelledby="modifiers-title"
    :class="embedded ? 'scroll-mt-24 pt-20 sm:pt-32' : 'mx-auto max-w-6xl scroll-mt-24 px-6 py-12 sm:py-24'"
  >
    <div class="max-w-3xl">
      <p class="eyebrow">
        Modifiers
      </p>
      <h2
        id="modifiers-title"
        class="mt-4 text-heading font-semibold tracking-tight text-balance"
      >
        Give the whole scene a finishing touch.
      </h2>
      <p class="mt-4 text-lead text-pretty text-muted-foreground">
        Keep your layers. Change the feeling. Modifiers transform the complete composition, from a broken signal to a softer focus. Toggle each one to compare.
      </p>
    </div>
    <div class="mt-10 grid gap-5 md:grid-cols-3">
      <ModifierCard
        v-for="card in modifierCards"
        :key="card.id"
        :name="card.name"
        :body="card.body"
        :scene="card.scene"
      />
    </div>
  </section>
</template>
