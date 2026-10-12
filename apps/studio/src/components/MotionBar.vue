<script setup lang="ts">
import { auroraStats } from '@goatsoft/aurora'
import { useStudio } from '@/editor/studio'

/** Motion: play/pause, the document's speed, reduced-motion preview, and a live perf readout. */
const studio = useStudio()
const { ui } = studio

const stats = ref<{ fps: number, ms: number, surfaces: number }>()
let last: { frames: number, at: number } | undefined
useIntervalFn(async () => {
  const s = await auroraStats()
  if (!s) return
  const now = performance.now()
  const fps = last ? ((s.frames - last.frames) * 1000) / (now - last.at) : 0
  last = { frames: s.frames, at: now }
  stats.value = { fps: Math.round(fps), ms: s.frameMs, surfaces: s.surfaces }
}, 1000)

const speed = computed(() => studio.rendered.value.motion.speed)
function setSpeed(v: number | undefined) {
  studio.commit(studio.ops.motion(studio.doc.value, 'speed', v), 'motion:speed')
}
const seedName = computed(() => {
  const layer = studio.rendered.value.layers[ui.layer]
  const generator = layer && studio.generator(layer.type)
  return generator ? Object.entries(generator.params).find(([, p]) => p.ui === 'seed') : undefined
})
function shuffle() {
  if (!seedName.value) return
  const [name, spec] = seedName.value
  studio.commit(studio.ops.param(studio.doc.value, ui.layer, name, Math.round(spec.min + Math.random() * (spec.max - spec.min))))
  studio.seal()
}
</script>

<template>
  <footer class="glass absolute bottom-4 left-1/2 z-30 flex h-12 -translate-x-1/2 items-center gap-1 rounded-2xl px-1.5 animate-[rise-in_500ms_cubic-bezier(0.2,0.9,0.1,1)]">
    <Tip :label="ui.playing ? 'Pause' : 'Play'" keys="Space" side="top">
      <Button size="icon" variant="subtle" :aria-label="ui.playing ? 'Pause' : 'Play'" @click="ui.playing = !ui.playing">
        <IHgPause v-if="ui.playing" />
        <IHgPlay v-else />
      </Button>
    </Tip>
    <div class="flex w-44 items-center gap-2 pl-2">
      <span class="text-[11px] text-muted-foreground">Speed</span>
      <ScrubField
        class="flex-1"
        label="Speed"
        :model-value="speed"
        :min="0"
        :max="4"
        :step="0.01"
        :default="1"
        unit="×"
        :set="studio.doc.value.motion?.speed !== undefined"
        @update:model-value="setSpeed"
        @reset="() => { setSpeed(undefined); studio.seal() }"
        @end="studio.seal()"
      />
    </div>
    <Tip label="Shuffle seed" keys="R" side="top">
      <Button size="icon" aria-label="Shuffle seed" :disabled="!seedName" @click="shuffle"><IHgShuffle /></Button>
    </Tip>
    <Tip label="Preview reduced motion" side="top">
      <Button size="icon" aria-label="Preview reduced motion" :data-state="ui.reducedMotion ? 'on' : 'off'" @click="ui.reducedMotion = !ui.reducedMotion"><IHgDashboardSpeed01 /></Button>
    </Tip>
    <span class="mx-1 h-5 w-px bg-panel-border" />
    <div class="flex min-w-36 items-center gap-2 px-2 font-mono text-[11px] text-muted-foreground tabular">
      <span class="size-1.5 rounded-full" :class="stats && stats.fps > 0 ? 'bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400' : 'bg-muted-foreground/50'" />
      <template v-if="stats && stats.surfaces">
        <span>{{ stats.fps }} fps</span>
        <span>{{ stats.ms.toFixed(1) }} ms</span>
      </template>
      <span v-else>CSS</span>
    </div>
  </footer>
</template>
