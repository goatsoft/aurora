<script setup lang="ts">
import Install from '@/content/install.md'

const steps = [
  { n: '01', title: 'Design it', body: 'Open Aurora Studio, start from a scene, and save a .aurora file. It\'s plain, declarative JSON.' },
  { n: '02', title: 'Import it', body: 'The unplugin validates it at build time, with errors at file:line:column, and types it.' },
  { n: '03', title: 'Drop it in', body: 'One component, or one custom element. The CSS fallback is in your HTML before any script runs.' },
]
</script>

<template>
  <section
    id="start"
    class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
  >
    <div class="grid items-start gap-12 lg:grid-cols-[1fr_1.15fr]">
      <div v-reveal>
        <p class="eyebrow">
          Three steps
        </p>
        <h2 class="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          From idea to <span class="text-spectrum">live background</span> in minutes.
        </h2>
        <ol class="mt-10 space-y-6">
          <li
            v-for="step in steps"
            :key="step.n"
            class="flex gap-4"
          >
            <span class="font-mono text-sm text-primary">{{ step.n }}</span>
            <div>
              <h3 class="font-semibold">
                {{ step.title }}
              </h3>
              <p class="mt-1 text-sm text-pretty text-muted-foreground">
                {{ step.body }}
              </p>
            </div>
          </li>
        </ol>
        <Button
          class="mt-10"
          variant="glass"
          as-child
        >
          <RouterLink to="/docs/guide/getting-started">
            Read the guide <IHgArrowRight01 />
          </RouterLink>
        </Button>
      </div>
      <div
        v-reveal="120"
        class="min-w-0"
      >
        <Install />
      </div>
    </div>
  </section>
</template>
