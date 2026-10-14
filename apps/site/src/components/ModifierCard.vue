<script setup lang="ts">
import type { AuroraMode, AuroraModule } from '@goatsoft/aurora'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { computed, ref } from 'vue'
import { useStudioHref } from '@/lib/studio-link'

const props = defineProps<{ name: string, body: string, scene: AuroraModule }>()
const enabled = ref(true)
const mode = ref<AuroraMode>('css')
const original = computed(() => {
  const { modifiers: _, ...doc } = props.scene.doc
  return doc
})
const preview = computed(() => enabled.value ? props.scene : original.value)
const href = useStudioHref(preview)
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-white/10 bg-surface/50">
    <div class="relative aspect-16/10 overflow-hidden">
      <AuroraBackground
        :src="preview"
        @mode-change="(value) => mode = value"
      />
      <p class="absolute top-3 left-3 rounded-full bg-black/55 px-3 py-1.5 font-mono text-xs text-white ring-1 ring-white/15">
        {{ mode === 'css' ? 'CSS fallback' : enabled ? 'Modifier on' : 'Original scene' }}
      </p>
    </div>
    <div class="p-5">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-xl font-semibold">
          {{ name }}
        </h3>
        <button
          type="button"
          :aria-label="`Toggle ${name}`"
          :aria-pressed="enabled"
          :disabled="mode !== 'webgpu'"
          :title="mode === 'css' ? 'Live comparison uses WebGPU' : 'Compare with the original scene'"
          class="inline-flex min-h-11 min-w-16 shrink-0 items-center justify-center rounded-full border border-border bg-background/40 px-3 text-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-default disabled:opacity-50"
          @click="enabled = !enabled"
        >
          {{ enabled ? 'On' : 'Off' }}
        </button>
      </div>
      <p class="mt-3 text-sm/relaxed text-muted-foreground">
        {{ body }}
      </p>
      <a
        :href="href"
        :aria-label="`Open ${name} example in Studio`"
        class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >Open in Studio <span aria-hidden="true">↗</span></a>
    </div>
  </article>
</template>
