<script setup lang="ts">
import type { AuroraModule } from '@goatsoft/aurora'
import { useAurora } from '@goatsoft/aurora-vue'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, reactive, ref, useId } from 'vue'
import { useSitePreferences } from '@/lib/preferences'

const props = defineProps<{ scene: AuroraModule, kind: 'follow' | 'impulse' | 'grab', body: string }>()
const target = ref<HTMLElement>()
const background = ref<HTMLElement>()
const mounted = ref(false)
const paused = ref(false)
const { paused: sitePaused } = useSitePreferences()
const playbackPaused = computed(() => paused.value || sitePaused.value)
const drag = ref(false)
const cursor = reactive({ x: 0.5, y: 0.5, held: false })
const keyboard = ref(false)
const gestures = computed(() => ({ grab: props.scene.doc.interactions?.some((module) => module.type === 'grab'), impulse: props.scene.doc.interactions?.some((module) => module.type === 'impulse') }))
const instruction = computed(() => `Focus the scene: arrows ${props.kind === 'impulse' ? 'choose the target' : 'move'}${gestures.value.impulse ? ', Enter emits a pulse' : ''}${gestures.value.grab ? ', G grabs or releases' : ''}, Escape resets. Playback can stay paused while you interact.`)
const help = `interaction-${useId()}`
const { stop } = useIntersectionObserver(target, ([entry]) => {
  if (!entry?.isIntersecting) return
  mounted.value = true
  stop()
}, { rootMargin: '200px' })
const { mode, surface } = useAurora(background, () => mounted.value ? props.scene : undefined, { paused: playbackPaused, interactionTarget: target, drag })
const live = computed(() => mode.value === 'webgpu' && !!surface.value?.interactions)
const css = computed(() => `position:absolute;inset:-10%;${props.scene.css.style}`)

function move(x: number, y: number) {
  keyboard.value = true
  cursor.x = Math.max(0, Math.min(1, x))
  cursor.y = Math.max(0, Math.min(1, y))
  surface.value?.interactions?.move(cursor.x, cursor.y)
}
function grab() {
  keyboard.value = true
  cursor.held = !cursor.held
  if (cursor.held) surface.value?.interactions?.grab(cursor.x, cursor.y)
  else surface.value?.interactions?.release()
}
function reset() {
  keyboard.value = false
  cursor.held = false
  cursor.x = cursor.y = 0.5
  surface.value?.interactions?.reset()
}
function pulse() {
  keyboard.value = true
  surface.value?.interactions?.activate(cursor.x, cursor.y)
}
function key(event: KeyboardEvent) {
  if (event.target !== event.currentTarget || !live.value || event.ctrlKey || event.metaKey || event.altKey) return
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-0.08, 0], ArrowRight: [0.08, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }
  const delta = arrows[event.key]
  if (delta) move(cursor.x + delta[0], cursor.y + delta[1])
  else if ((event.key === 'Enter' || event.key === ' ') && gestures.value.impulse) pulse()
  else if (event.key.toLowerCase() === 'g' && gestures.value.grab) {
    if (!event.repeat) grab()
  } else if (event.key === 'Escape') reset()
  else return
  event.preventDefault()
  event.stopPropagation()
}
function blur() {
  if (cursor.held) grab()
  surface.value?.interactions?.leave()
}
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-border bg-surface/40">
    <div
      ref="target"
      role="group"
      tabindex="0"
      :aria-label="`${scene.doc.name} interaction playground`"
      :aria-describedby="help"
      class="relative isolate aspect-video overflow-hidden bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      @keydown="key"
      @blur="blur"
      @pointermove="keyboard = false"
      @pointerdown="keyboard = false"
    >
      <div
        ref="background"
        class="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div
          v-if="!surface"
          :style="css"
        />
      </div>
      <span
        v-if="keyboard && live"
        aria-hidden="true"
        class="pointer-events-none absolute top-(--target-y) left-(--target-x) size-2.5 -translate-1/2 rounded-full border border-white bg-black/40 ring-4 ring-black/20"
        :style="{ '--target-x': `${cursor.x * 100}%`, '--target-y': `${cursor.y * 100}%` }"
      />
      <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 to-transparent px-5 pt-12 pb-5">
        <span class="inline-flex rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/90 backdrop-blur-sm">
          {{ live ? kind === 'grab' ? drag ? 'Drag, then release' : 'Enable drag or press G to grab' : kind === 'impulse' ? 'Tap to respond' : 'Move to follow the light' : 'CSS fallback' }}
        </span>
      </div>
      <EditInStudio :src="scene" />
    </div>
    <div class="p-5">
      <h3 class="text-lg font-semibold">
        {{ scene.doc.name }}
      </h3>
      <p class="mt-2 text-sm/relaxed text-muted-foreground">
        {{ body }}
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          class="min-h-11 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-70"
          :aria-label="sitePaused ? `${scene.doc.name} paused site-wide` : `${playbackPaused ? 'Play' : 'Pause'} ${scene.doc.name}`"
          :aria-pressed="playbackPaused"
          :disabled="sitePaused"
          :title="sitePaused ? 'Resume animations using a hero or demo playback control.' : undefined"
          @click="paused = !paused"
        >
          {{ sitePaused ? 'Paused site-wide' : playbackPaused ? 'Play' : 'Pause' }}
        </button>
        <button
          v-if="kind === 'follow'"
          :disabled="!live"
          class="min-h-11 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-50"
          @click="move(0.8, 0.3)"
        >
          Move the light
        </button>
        <button
          v-else-if="kind === 'impulse'"
          :disabled="!live"
          class="min-h-11 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-50"
          @click="pulse"
        >
          Emit pulse
        </button>
        <template v-else>
          <button
            :disabled="!live"
            :aria-pressed="cursor.held"
            class="min-h-11 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-50"
            @click="grab"
          >
            {{ cursor.held ? 'Release' : 'Grab' }}
          </button>
          <button
            :disabled="!live || !cursor.held"
            class="min-h-11 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-50"
            @click="move(0.8, 0.6)"
          >
            Pull right
          </button>
        </template>
        <button
          :disabled="!live"
          class="min-h-11 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-50"
          @click="reset"
        >
          Reset
        </button>
      </div>
      <label
        v-if="kind === 'grab'"
        class="mt-4 flex min-h-11 w-fit items-center gap-3 text-sm"
      >
        <input
          v-model="drag"
          type="checkbox"
          class="size-4 accent-primary"
          :aria-label="`Enable pointer drag for ${scene.doc.name}`"
        >
        Enable pointer drag <span class="text-xs text-muted-foreground">Reserves touch gestures</span>
      </label>
      <p
        :id="help"
        class="mt-4 text-xs/relaxed text-muted-foreground"
      >
        {{ instruction }}
      </p>
      <p
        class="sr-only"
        aria-live="polite"
      >
        Cursor {{ Math.round(cursor.x * 100) }}%, {{ Math.round(cursor.y * 100) }}%. {{ cursor.held ? 'Grabbed.' : 'Released.' }}
      </p>
    </div>
  </article>
</template>
