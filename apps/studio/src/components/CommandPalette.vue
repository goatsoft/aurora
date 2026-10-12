<script setup lang="ts">
import type { Component } from 'vue'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { newLayer, starter } from '@/editor/document'
import { VIEWPORTS, useStudio } from '@/editor/studio'
import type { Preview, Viewport } from '@/editor/studio'
import { generatorIcon } from '@/lib/generators'

export interface Command {
  id: string
  label: string
  group: string
  keys?: string
  icon?: Component
  run: () => void
}

/** ⌘K: every action in Studio, fuzzy-searchable, runnable from the keyboard. */
const props = defineProps<{ actions: { save: () => void, share: () => void, openFile: () => void, openFolder: () => void, saveAs: () => void } }>()
const studio = useStudio()
const { ui } = studio
const query = ref('')
const active = ref(0)
const list = ref<HTMLElement>()

const commands = computed<Command[]>(() => [
  ...studio.generators.value.map((g) => ({
    id: `add:${g.id}`,
    label: `Add ${g.label}`,
    group: 'Layers',
    icon: generatorIcon(g.id),
    run: () => studio.layers.add(newLayer(g.id, Array.from({ length: g.colors }, (_, k) => Math.min(k, studio.doc.value.palette.length - 1))), ui.layer + 1),
  })),
  { id: 'duplicate', label: 'Duplicate layer', group: 'Layers', keys: '⌘ D', run: () => studio.layers.duplicate(ui.layer) },
  { id: 'delete', label: 'Delete layer', group: 'Layers', keys: '⌫', run: () => studio.layers.remove(ui.layer) },
  { id: 'gallery', label: 'Browse presets', group: 'Document', keys: 'G', run: () => (ui.gallery = true) },
  { id: 'open', label: 'Open .aurora file…', group: 'Document', keys: '⌘ O', run: props.actions.openFile },
  ...(studio.canUseDisk() ? [{ id: 'folder', label: 'Open folder…', group: 'Document', run: props.actions.openFolder }] : []),
  { id: 'save', label: 'Save', group: 'Document', keys: '⌘ S', run: props.actions.save },
  ...(studio.canUseDisk() ? [{ id: 'save-as', label: 'Save as…', group: 'Document', keys: '⇧ ⌘ S', run: props.actions.saveAs }] : []),
  { id: 'share', label: 'Copy share link', group: 'Document', run: props.actions.share },
  { id: 'new', label: 'New document', group: 'Document', run: () => studio.open(starter()) },
  { id: 'undo', label: 'Undo', group: 'Edit', keys: '⌘ Z', run: studio.undo },
  { id: 'redo', label: 'Redo', group: 'Edit', keys: '⇧ ⌘ Z', run: studio.redo },
  ...(Object.keys(VIEWPORTS) as Viewport[]).map((v, i) => ({ id: `viewport:${v}`, label: `Viewport: ${VIEWPORTS[v].label}`, group: 'View', keys: String(i + 1), run: () => (ui.viewport = v) })),
  ...([['webgpu', 'WebGPU'], ['split', 'Side by side'], ['css', 'CSS fallback']] as [Preview, string][]).map(([v, label]) => ({ id: `preview:${v}`, label: `Preview: ${label}`, group: 'View', run: () => (ui.preview = v) })),
  { id: 'page', label: ui.page === 'dark' ? 'Preview on a light page' : 'Preview on a dark page', group: 'View', keys: 'L', run: () => (ui.page = ui.page === 'dark' ? 'light' : 'dark') },
  { id: 'play', label: ui.playing ? 'Pause' : 'Play', group: 'View', keys: 'Space', run: () => (ui.playing = !ui.playing) },
  { id: 'reduced', label: ui.reducedMotion ? 'Stop previewing reduced motion' : 'Preview reduced motion', group: 'View', run: () => (ui.reducedMotion = !ui.reducedMotion) },
])

/** Subsequence match: every typed character in order, earlier and denser matches first. */
function score(label: string, q: string): number {
  if (!q) return 1
  const text = label.toLowerCase()
  let at = -1
  let gaps = 0
  for (const ch of q.toLowerCase()) {
    const next = text.indexOf(ch, at + 1)
    if (next < 0) return 0
    gaps += next - at - 1
    at = next
  }
  return 1 / (1 + gaps + text.indexOf(q[0]!.toLowerCase()) * 0.5)
}
const results = computed(() => commands.value.map((c) => ({ c, s: score(c.label, query.value.trim()) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s).map((r) => r.c))
watch(query, () => (active.value = 0))
watch(() => ui.palette, (open) => {
  if (open) query.value = ''
})

function run(command: Command | undefined) {
  if (!command) return
  ui.palette = false
  command.run()
}
function key(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const n = results.value.length
    active.value = (active.value + (event.key === 'ArrowDown' ? 1 : -1) + n) % n
    void nextTick(() => list.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }))
  } else if (event.key === 'Enter') {
    event.preventDefault()
    run(results.value[active.value])
  }
}
</script>

<template>
  <DialogRoot v-model:open="ui.palette">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-[oklch(0.08_0.02_270/0.4)] backdrop-blur-[2px]" />
      <DialogContent class="glass fixed top-[18vh] left-1/2 z-50 w-[min(560px,90vw)] -translate-x-1/2 overflow-hidden rounded-2xl outline-none data-[state=open]:animate-[rise-in_220ms_cubic-bezier(0.2,0.9,0.1,1)]" @keydown="key">
        <DialogTitle class="sr-only">Commands</DialogTitle>
        <div class="flex items-center gap-2.5 border-b border-panel-border px-4">
          <IHgSearch01 class="size-4 text-muted-foreground" />
          <input v-model="query" placeholder="Type a command…" aria-label="Search commands" class="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground">
          <Kbd>esc</Kbd>
        </div>
        <ul ref="list" class="max-h-[46vh] overflow-y-auto p-1.5" role="listbox">
          <li
            v-for="(command, i) in results"
            :key="command.id"
            role="option"
            :aria-selected="i === active"
            :data-active="i === active"
            class="flex h-9 cursor-default items-center gap-3 rounded-lg px-2.5 text-xs transition-colors"
            :class="i === active ? 'bg-accent text-foreground' : 'text-muted-foreground'"
            @pointermove="active = i"
            @click="run(command)"
          >
            <component :is="command.icon" v-if="command.icon" class="size-4" />
            <span v-else class="size-4" />
            <span class="flex-1">{{ command.label }}</span>
            <span class="text-[10px] text-muted-foreground/70">{{ command.group }}</span>
            <span v-if="command.keys" class="flex gap-0.5"><Kbd v-for="k in command.keys.split(' ')" :key="k">{{ k }}</Kbd></span>
          </li>
          <li v-if="!results.length" class="px-3 py-6 text-center text-xs text-muted-foreground">Nothing matches “{{ query }}”</li>
        </ul>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
