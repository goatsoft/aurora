<script setup lang="ts">
const numbers = [
  { value: '7 kB', label: 'Main-thread runtime, gzipped, under a 10 kB budget enforced in CI.' },
  { value: '12', label: 'Built-in generators, each under 2 kB gzipped, loaded the first time a page uses one.' },
  { value: '1st', label: 'Frame paints the CSS fallback, before any script. No flash, no layout shift.' },
  { value: '100%', label: 'Test coverage of the colour maths and the file format.' },
]
</script>

<template>
  <section class="mx-auto max-w-6xl px-6 py-16">
    <div class="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="(n, i) in numbers"
        :key="n.value"
        v-reveal="i * 70"
        class="bg-background p-6"
      >
        <p class="text-spectrum text-4xl font-semibold tracking-tight">
          {{ n.value }}
        </p>
        <p class="mt-2 text-sm text-pretty text-muted-foreground">
          {{ n.label }}
        </p>
      </div>
    </div>
  </section>
</template>
