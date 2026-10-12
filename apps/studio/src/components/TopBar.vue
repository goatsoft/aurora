<script setup lang="ts">
import { useStudio } from '@/editor/studio'
import type { Preview, Viewport } from '@/editor/studio'
import { download, snippets } from '@/editor/export'

const studio = useStudio()
const { ui } = studio

const viewports: { value: Viewport, label: string, keys: string }[] = [
  { value: 'hero', label: 'Hero', keys: '1' },
  { value: 'panel', label: 'Panel', keys: '2' },
  { value: 'tile', label: 'Tile', keys: '3' },
  { value: 'phone', label: 'Phone', keys: '4' },
  { value: 'page', label: 'Full page', keys: '5' },
]
const previews: { value: Preview, label: string }[] = [
  { value: 'webgpu', label: 'WebGPU' },
  { value: 'split', label: 'Split' },
  { value: 'css', label: 'CSS' },
]

const exporting = ref(false)
const copied = ref<string>()
const code = computed(() => snippets(studio.fileName.value, studio.rendered.value))
async function copy(id: string, text: string) {
  await navigator.clipboard.writeText(text)
  copied.value = id
  setTimeout(() => (copied.value = undefined), 1400)
}
function save() {
  download(studio.fileName.value, studio.file.value)
  exporting.value = false
  studio.notify(`Saved ${studio.fileName.value}`)
}
async function share() {
  await navigator.clipboard.writeText(await studio.shareLink())
  studio.notify('Link copied: it holds the whole document, no account needed')
}
defineExpose({ save, share })
</script>

<template>
  <header class="pointer-events-none absolute inset-x-4 top-4 z-30 flex items-start justify-between gap-4">
    <div class="glass pointer-events-auto flex h-11 items-center gap-2.5 rounded-2xl pr-3 pl-2.5 animate-[rise-in_350ms_cubic-bezier(0.2,0.9,0.1,1)]">
      <div class="size-6 rounded-lg bg-[conic-gradient(from_200deg_in_oklch,oklch(0.75_0.17_160),oklch(0.68_0.16_245),oklch(0.6_0.24_305),oklch(0.75_0.17_160))] shadow-[0_0_16px_oklch(0.68_0.16_245/0.6)]" />
      <span class="text-xs font-semibold tracking-tight">Aurora Studio</span>
      <span class="h-4 w-px bg-panel-border" />
      <input
        :value="studio.doc.value.name"
        aria-label="Document name"
        class="w-44 truncate rounded-md bg-transparent px-1.5 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-input focus:bg-input focus:text-foreground"
        @change="(e) => { studio.apply(studio.ops.rename, (e.target as HTMLInputElement).value.trim() || 'Untitled'); studio.seal() }"
        @keydown.enter="(e) => (e.target as HTMLInputElement).blur()"
      >
    </div>

    <div class="glass pointer-events-auto flex h-11 items-center gap-1.5 rounded-2xl px-1.5 animate-[rise-in_400ms_cubic-bezier(0.2,0.9,0.1,1)]">
      <Segmented v-model="ui.viewport" :options="viewports" class="w-[190px]">
        <template #hero><IHgComputer /></template>
        <template #panel><IHgImage01 /></template>
        <template #tile><IHgSquare /></template>
        <template #phone><IHgSmartPhone01 /></template>
        <template #page><IHgLayout03 /></template>
      </Segmented>
      <span class="h-5 w-px bg-panel-border" />
      <Tip :label="ui.page === 'dark' ? 'Light page' : 'Dark page'" keys="L">
        <Button size="icon" :aria-label="ui.page === 'dark' ? 'Preview on a light page' : 'Preview on a dark page'" @click="ui.page = ui.page === 'dark' ? 'light' : 'dark'">
          <IHgMoon02 v-if="ui.page === 'dark'" />
          <IHgSun03 v-else />
        </Button>
      </Tip>
      <span class="h-5 w-px bg-panel-border" />
      <Segmented v-model="ui.preview" :options="previews" size="sm" class="w-[200px]" />
    </div>

    <div class="glass pointer-events-auto flex h-11 items-center gap-0.5 rounded-2xl px-1.5 animate-[rise-in_450ms_cubic-bezier(0.2,0.9,0.1,1)]">
      <Tip label="Undo" keys="⌘ Z"><Button size="icon" aria-label="Undo" :disabled="!studio.history.canUndo" @click="studio.undo()"><IHgArrowTurnBackward /></Button></Tip>
      <Tip label="Redo" keys="⇧ ⌘ Z"><Button size="icon" aria-label="Redo" :disabled="!studio.history.canRedo" @click="studio.redo()"><IHgArrowTurnForward /></Button></Tip>
      <span class="mx-1 h-5 w-px bg-panel-border" />
      <Tip label="Presets" keys="G"><Button size="icon" aria-label="Presets" @click="ui.gallery = true"><IHgGridView /></Button></Tip>
      <Tip label="Copy share link"><Button size="icon" aria-label="Share" @click="share"><IHgLink01 /></Button></Tip>
      <Tip label="Commands" keys="⌘ K"><Button size="icon" aria-label="Commands" @click="ui.palette = true"><IHgCommand /></Button></Tip>
      <Popover v-model:open="exporting" align="end" class="w-[380px] p-2">
        <template #trigger>
          <Button variant="default" class="ml-1"><IHgDownload04 />Export</Button>
        </template>
        <button class="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent" @click="save">
          <div class="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary"><IHgFile01 class="size-4" /></div>
          <div class="flex-1">
            <p class="text-xs font-medium">{{ studio.fileName.value }}</p>
            <p class="text-[11px] text-muted-foreground">The document, ready for the unplugin or &lt;aurora-bg&gt;</p>
          </div>
          <span class="flex gap-0.5"><Kbd>⌘</Kbd><Kbd>S</Kbd></span>
        </button>
        <div class="mt-1 flex flex-col gap-1.5 border-t border-panel-border p-1 pt-2">
          <div v-for="snippet in code" :key="snippet.id" class="overflow-hidden rounded-lg bg-[oklch(0.1_0.015_270/0.7)] ring-1 ring-panel-border">
            <div class="flex items-center justify-between px-2.5 py-1.5">
              <span class="text-[11px] font-medium text-muted-foreground">{{ snippet.label }}</span>
              <Button size="sm" class="h-6 px-2" @click="copy(snippet.id, snippet.code)">
                <IHgTick02 v-if="copied === snippet.id" class="text-emerald-300" />
                <IHgCopy01 v-else />
                {{ copied === snippet.id ? 'Copied' : 'Copy' }}
              </Button>
            </div>
            <pre class="max-h-28 overflow-auto px-2.5 pb-2 font-mono text-[10.5px] leading-relaxed text-muted-foreground select-text">{{ snippet.code }}</pre>
          </div>
        </div>
      </Popover>
    </div>
  </header>
</template>
