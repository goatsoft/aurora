<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Install from '@/content/install.md'

const steps = [
  { n: '01', title: 'Design it', body: 'Open Aurora Studio, start from a scene or a blank canvas, and save a .aurora file. The file is plain JSON.' },
  { n: '02', title: 'Import it', body: 'The bundler plugin checks the file when you build, reports mistakes with a line and column, and gives the import a type.' },
  { n: '03', title: 'Add it to a page', body: 'Use the Vue component or the custom element.' },
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
          Workflow
        </p>
        <h2 class="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          From Studio to <span class="text-spectrum">your site</span>
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
          :as="RouterLink"
          to="/docs/guide/getting-started"
        >
          Read the guide <IHgArrowRight01 />
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
