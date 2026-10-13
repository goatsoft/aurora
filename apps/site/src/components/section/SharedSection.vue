<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { northernLights, solarWinds } from '@/lib/scenes'

/** Three separate elements in one scene: one clock and one field, so the curtains cross the gaps. */
const shared = ref(true)
const examples = [
  { id: 'northern-lights', label: 'Northern lights', src: northernLights },
  { id: 'solar-winds', label: 'Solar winds', src: solarWinds },
]
const example = ref(examples[0]!)
const cards = [{ label: 'Card one' }, { label: 'Card two' }, { label: 'Card three' }]
</script>

<template>
  <section
    id="shared"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
  >
    <div
      v-reveal
      class="mx-auto max-w-2xl text-center"
    >
      <p class="eyebrow">
        Shared backgrounds
      </p>
      <h2 class="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        One background across separate panels
      </h2>
      <p class="mt-4 text-lg text-pretty text-muted-foreground">
        One continuous background across three cards. Toggle it to compare.
      </p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          class="inline-flex min-h-11 items-center gap-3 rounded-full border border-border bg-surface/60 px-4 text-sm"
          :aria-pressed="shared"
          @click="shared = !shared"
        >
          <span
            class="relative h-5 w-9 rounded-full transition-colors"
            :class="shared ? 'bg-primary' : 'bg-white/15'"
          ><span
            class="absolute top-0.5 size-4 rounded-full bg-white transition-[left]"
            :class="shared ? 'left-4.5' : 'left-0.5'"
          /></span>
          {{ shared ? 'One scene' : 'Three separate backgrounds' }}
        </button>
        <div
          role="group"
          aria-label="Example"
          class="inline-flex min-h-11 items-center rounded-full border border-border bg-surface/60 p-1 text-sm"
        >
          <button
            v-for="e in examples"
            :key="e.id"
            type="button"
            class="min-h-9 rounded-full px-4 transition-colors"
            :class="example.id === e.id ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'"
            :aria-pressed="example.id === e.id"
            @click="example = e"
          >
            {{ e.label }}
          </button>
        </div>
      </div>
    </div>
    <div class="mt-12 grid gap-4 sm:grid-cols-3">
      <div
        v-for="(card, i) in cards"
        :key="card.label"
        v-reveal="i * 80"
        class="relative isolate flex aspect-4/5 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-5"
      >
        <div class="absolute inset-0 -z-10">
          <AuroraBackground
            :src="example.src"
            v-bind="shared ? { scene: `shared-demo-${example.id}` } : {}"
          />
        </div>
        <div class="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-linear-to-t from-background/90 to-transparent" />
        <h3 class="font-semibold">
          {{ card.label }}
        </h3>
        <EditInStudio
          v-if="i === cards.length - 1"
          :src="example.src"
        />
      </div>
    </div>
    <p class="mt-8 text-center">
      <RouterLink
        to="/docs/guide/shared-backgrounds"
        class="text-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
      >
        How shared backgrounds work
      </RouterLink>
    </p>
  </section>
</template>
