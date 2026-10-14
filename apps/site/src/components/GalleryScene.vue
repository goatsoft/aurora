<script setup lang="ts">
import type { AuroraModule } from '@goatsoft/aurora'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { useStudioHref } from '@/lib/studio-link'

const props = defineProps<{ scene: AuroraModule, body: string }>()
const href = useStudioHref(() => props.scene)
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-white/10 bg-surface/50">
    <div class="relative aspect-16/10 overflow-hidden">
      <AuroraBackground :src="scene" />
    </div>
    <div class="p-5 sm:p-6">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-xl font-semibold">
          {{ scene.doc.name }}
        </h3>
        <p class="font-mono text-xs text-muted-foreground">
          {{ scene.doc.layers.length }} layers
        </p>
      </div>
      <p class="mt-3 text-sm/relaxed text-muted-foreground">
        {{ body }}
      </p>
      <a
        :href="href"
        :aria-label="`Open ${scene.doc.name} in Studio`"
        class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        Open in Studio <span aria-hidden="true">↗</span>
      </a>
    </div>
  </article>
</template>
