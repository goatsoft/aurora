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
      <p
        v-if="!embedded"
        class="eyebrow"
      >
        Modifiers
      </p>
      <h2
        id="modifiers-title"
        :class="embedded ? '' : 'mt-4'"
        class="text-heading font-semibold tracking-tight text-balance"
      >
        {{ embedded ? 'Modifiers' : 'Give the whole scene a finishing touch.' }}
      </h2>
      <p class="mt-4 text-lead text-pretty text-muted-foreground">
        {{ embedded ? 'Effects applied to the whole scene. Drag the divider to compare.' : 'Keep your layers. Change the feeling. Modifiers transform the complete composition, from a broken signal to a softer focus. Drag each divider to compare.' }}
      </p>
    </div>
    <div class="mt-10 grid gap-5 md:grid-cols-3">
      <ModifierCard
        v-for="card in modifierCards"
        :key="card.id"
        :name="card.name"
        :body="embedded ? card.summary : card.body"
        :scene="card.scene"
      />
    </div>
  </section>
</template>
