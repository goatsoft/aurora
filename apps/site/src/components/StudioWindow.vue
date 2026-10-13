<script setup lang="ts">
import type { AuroraModule } from '@goatsoft/aurora'
import { GENERATORS } from '@goatsoft/aurora'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { layerThumb } from '@/lib/scenes'

/** A picture of Aurora Studio editing a scene, with the real scene running in its canvas. */
const props = defineProps<{ scene: AuroraModule, title?: string }>()
const doc = computed(() => props.scene.doc)
const layers = computed(() => [...doc.value.layers].reverse().map((layer) => ({ layer, label: GENERATORS[layer.type]?.label ?? layer.type, thumb: layerThumb(doc.value, layer) })))
// The inspector shows the aurora layer's real params; specs for built-ins load with the page.
const inspected = computed(() => doc.value.layers.find((l) => l.type === 'aurora-fbm') ?? doc.value.layers[0]!)
const params = computed(() => Object.entries(GENERATORS[inspected.value.type]?.params ?? {}).slice(0, 5).map(([name, spec]) => {
  const raw = inspected.value.params[name]
  const value = typeof raw === 'number' ? raw : spec.default
  return { name: spec.label, value, fill: (value - spec.min) / (spec.max - spec.min) }
}))
</script>

<template>
  <figure class="overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.15_0.025_272)] shadow-[0_40px_120px_-40px_oklch(0_0_0/0.9),0_0_0_1px_oklch(1_0_0/0.04)_inset]">
    <div class="flex h-10 items-center gap-2 border-b border-white/5 px-4">
      <span class="size-3 rounded-full bg-[#ff5f57]" /><span class="size-3 rounded-full bg-[#febc2e]" /><span class="size-3 rounded-full bg-[#28c840]" />
      <span class="mx-auto text-xs text-muted-foreground">Aurora Studio · {{ props.title ?? doc.name }}</span>
    </div>
    <div class="relative grid aspect-video grid-cols-[minmax(0,12rem)_1fr_minmax(0,14rem)] max-md:grid-cols-1">
      <div class="absolute inset-0">
        <AuroraBackground :src="props.scene" />
      </div>
      <!-- Layers -->
      <div class="relative m-3 self-start rounded-xl bg-[oklch(0.17_0.02_270/0.7)] p-2 backdrop-blur-xl max-md:hidden">
        <p class="px-1.5 pb-2 text-[11px] font-semibold">
          Layers
        </p>
        <div
          v-for="({ label, thumb }, i) in layers"
          :key="i"
          class="flex items-center gap-2 rounded-lg p-1.5"
          :class="i === 1 && 'bg-white/8'"
        >
          <div class="relative size-7 shrink-0 overflow-hidden rounded-md bg-background ring-1 ring-white/10">
            <div :style="thumb" />
          </div>
          <span class="truncate text-[11px]">{{ label }}</span>
        </div>
      </div>
      <div />
      <!-- Inspector -->
      <div class="relative m-3 self-start rounded-xl bg-[oklch(0.17_0.02_270/0.7)] p-3 backdrop-blur-xl max-md:hidden">
        <p class="pb-2 text-[11px] font-semibold">
          Parameters
        </p>
        <div
          v-for="param in params"
          :key="param.name"
          class="mb-1.5 grid grid-cols-[4.5rem_1fr] items-center gap-2"
        >
          <span class="truncate text-[10px] text-muted-foreground">{{ param.name }}</span>
          <div class="relative h-5 overflow-hidden rounded-sm bg-white/6">
            <div
              class="absolute inset-y-0 left-0 bg-spectrum-2/30"
              :style="{ width: `${Math.min(1, param.fill) * 100}%` }"
            />
            <span class="absolute inset-y-0 right-1.5 flex items-center font-mono text-[10px]">{{ param.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </figure>
</template>
