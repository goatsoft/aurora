<script setup lang="ts">
import { TooltipProvider } from 'reka-ui'
import { useStudio } from '@/editor/studio'
import type { Viewport } from '@/editor/studio'
import type TopBar from '@/components/TopBar.vue'

/**
 * The editor: a full-bleed live canvas with floating glass panels. Everything is reachable from
 * the keyboard; ⌘K lists it all.
 */
const studio = useStudio()
const { ui } = studio
const top = ref<InstanceType<typeof TopBar>>()
const picker = ref<HTMLInputElement>()
onMounted(() => void studio.start())
// On the html element, so popovers and dialogs (portalled to <body>) follow it too.
watchEffect(() => document.documentElement.classList.toggle('page-light', ui.page === 'light'))

const actions = {
  save: () => top.value?.save(),
  share: () => void top.value?.share(),
  openFile: () => picker.value?.click(),
}

const typing = (event: KeyboardEvent) => {
  const el = event.target as HTMLElement
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}
const VIEWPORT_KEYS: Viewport[] = ['hero', 'panel', 'tile', 'phone', 'page']
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  const mod = event.metaKey || event.ctrlKey
  const k = event.key.toLowerCase()
  if (mod && k === 'k') {
    event.preventDefault()
    ui.palette = !ui.palette
    return
  }
  if (ui.palette || ui.gallery) return
  if (mod && k === 'z') {
    event.preventDefault()
    if (event.shiftKey) studio.redo()
    else studio.undo()
  } else if (mod && k === 'y') {
    event.preventDefault()
    studio.redo()
  } else if (mod && k === 's') {
    event.preventDefault()
    actions.save()
  } else if (mod && k === 'o') {
    event.preventDefault()
    actions.openFile()
  } else if (mod && k === 'd') {
    event.preventDefault()
    studio.layers.duplicate(ui.layer)
  } else if (mod || typing(event)) {
    return
  } else if (k === 'backspace' || k === 'delete') {
    studio.layers.remove(ui.layer)
  } else if (k === ' ') {
    event.preventDefault()
    ui.playing = !ui.playing
  } else if (k === 'g') {
    ui.gallery = true
  } else if (k === 'l') {
    ui.page = ui.page === 'dark' ? 'light' : 'dark'
  } else if (k >= '1' && k <= '5') {
    ui.viewport = VIEWPORT_KEYS[Number(k) - 1]!
  } else if (k === '[' || k === ']') {
    const n = studio.doc.value.layers.length
    ui.layer = Math.max(0, Math.min(n - 1, ui.layer + (k === ']' ? 1 : -1)))
  } else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    event.preventDefault()
    const to = ui.layer + (event.key === 'ArrowUp' ? 1 : -1)
    if (to >= 0 && to < studio.doc.value.layers.length) studio.layers.move(ui.layer, to)
  } else if (k === 'm' || k === 's') {
    const id = studio.layerIds.value[ui.layer]!
    if (k === 's') ui.solo = ui.solo === id ? undefined : id
    else if (ui.muted.has(id)) ui.muted.delete(id)
    else ui.muted.add(id)
  } else if (k === 'r') {
    const layer = studio.rendered.value.layers[ui.layer]
    const seed = layer && Object.entries(studio.generator(layer.type)?.params ?? {}).find(([, p]) => p.ui === 'seed')
    if (seed) {
      studio.commit(studio.ops.param(studio.doc.value, ui.layer, seed[0], Math.round(seed[1].min + Math.random() * (seed[1].max - seed[1].min))))
      studio.seal()
    }
  }
})

// Drop a .aurora file anywhere to open it.
const dropping = ref(false)
let depth = 0
useEventListener(window, 'dragenter', (e: DragEvent) => {
  if (!e.dataTransfer?.types.includes('Files')) return
  depth++
  dropping.value = true
})
useEventListener(window, 'dragleave', () => {
  depth = Math.max(0, depth - 1)
  if (!depth) dropping.value = false
})
useEventListener(window, 'dragover', (e: DragEvent) => e.preventDefault())
useEventListener(window, 'drop', (e: DragEvent) => {
  e.preventDefault()
  depth = 0
  dropping.value = false
  const file = e.dataTransfer?.files[0]
  if (file) void studio.openFile(file)
})
</script>

<template>
  <TooltipProvider>
    <main class="relative h-full w-full overflow-hidden" aria-label="Aurora Studio">
      <Stage />
      <TopBar ref="top" />
      <LayersPanel />
      <Inspector />
      <MotionBar />
      <Notices />
      <Gallery />
      <CommandPalette :actions="actions" />
      <input ref="picker" type="file" accept=".aurora,application/json" class="hidden" @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) void studio.openFile(f); (e.target as HTMLInputElement).value = '' }">
      <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition duration-200" leave-active-class="transition duration-200">
        <div v-if="dropping" class="pointer-events-none absolute inset-3 z-50 grid place-items-center rounded-3xl border-2 border-dashed border-primary/70 bg-primary/10 backdrop-blur-sm">
          <div class="glass flex items-center gap-3 rounded-2xl px-5 py-4">
            <IHgUpload04 class="size-5 text-primary" />
            <span class="text-sm font-medium">Drop to open the .aurora file</span>
          </div>
        </div>
      </Transition>
    </main>
  </TooltipProvider>
</template>
