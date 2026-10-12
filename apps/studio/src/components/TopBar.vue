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

// Fidelity: how close the CSS fallback is to WebGPU, shown while comparing them.
const score = ref<number>()
const comparing = computed(() => ui.preview !== 'webgpu')
watchDebounced([() => studio.rendered.value, () => ui.page, comparing], async () => {
  if (!comparing.value) return
  const { fidelity } = await import('@/lib/fidelity')
  score.value = await fidelity(studio.rendered.value, ui.page === 'dark' ? 'oklch(0.13 0.02 270)' : 'oklch(0.985 0.004 270)')
}, { debounce: 350, immediate: true })

const exporting = ref(false)
const copied = ref<string>()
const code = computed(() => snippets(studio.fileName.value, studio.rendered.value))
async function copy(id: string, text: string) {
  await navigator.clipboard.writeText(text)
  copied.value = id
  setTimeout(() => (copied.value = undefined), 1400)
}
/**
 * ⌘S: save the open file in place; with nothing open, choose where (File System Access), or
 * download where the browser can't save in place.
 */
async function save() {
  exporting.value = false
  if (await studio.saveToProject()) return
  if (project.workspace && project.workspace.kind !== 'file') {
    // A folder or project is open but no file in it yet: name the new file.
    browsing.value = true
    return
  }
  if (await studio.saveAs()) return
  downloadFile()
}
function downloadFile() {
  exporting.value = false
  download(studio.fileName.value, studio.file.value)
  studio.notify(`Downloaded ${studio.fileName.value}`)
}
const project = studio.project
const browsing = ref(false)
const newName = ref('')
watch(browsing, (open) => {
  if (open) {
    newName.value = project.current ?? studio.fileName.value
    if (project.locked || !project.files.length) void studio.refreshFiles()
  }
})
async function saveAsNamed() {
  const name = newName.value.trim()
  if (!name) return
  browsing.value = false
  await studio.saveAs(name)
}
const folders = computed(() => {
  const groups = new Map<string, string[]>()
  for (const path of project.files) {
    const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
    groups.set(folder, [...(groups.get(folder) ?? []), path])
  }
  return [...groups.entries()]
})
const where = computed(() => ({
  api: `Your project ${project.label}, through its dev server. ⌘S saves back to disk and the site hot-reloads.`,
  folder: `The folder ${project.label} on this computer. ⌘S saves in place.`,
  file: `${project.label} on this computer. ⌘S saves in place.`,
})[project.workspace?.kind ?? 'file'])
const opening = ref(false)
async function openFolder() {
  opening.value = false
  browsing.value = false
  await studio.openFolder()
}
async function openFromDisk() {
  opening.value = false
  await studio.openFromDisk()
}
async function openFile(path: string) {
  browsing.value = false
  await studio.openProjectFile(path)
}
async function poster() {
  exporting.value = false
  try {
    const { renderPoster } = await import('@goatsoft/aurora/poster')
    download(studio.fileName.value.replace(/\.aurora$/, '-poster.png'), await renderPoster(studio.rendered.value, { width: 1200, height: 630, time: 4 }))
    studio.notify('Saved a 1200 × 630 poster, sized for og:image')
  } catch (error) {
    studio.notify(error instanceof Error ? error.message : String(error), 'error')
  }
}
async function share() {
  await navigator.clipboard.writeText(await studio.shareLink())
  studio.notify('Link copied: it holds the whole document, no account needed')
}
/** ⇧⌘S: a new file in the open folder or project, or anywhere via the system picker. */
function saveAs() {
  if (project.workspace && project.workspace.kind !== 'file') browsing.value = true
  else void studio.saveAs()
}
defineExpose({ save: () => void save(), share, saveAs })
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
      <span v-if="project.workspace || studio.canUseDisk()" class="h-4 w-px bg-panel-border" />
      <Popover v-if="project.workspace" v-model:open="browsing" align="start" class="w-[320px] p-1.5">
        <template #trigger>
          <Button size="sm" class="max-w-56 gap-1.5" aria-label="Files">
            <IHgFolderOpen v-if="project.workspace.kind !== 'file'" />
            <IHgFile01 v-else />
            <span class="truncate">{{ project.locked ? `Reopen ${project.label}` : project.current ?? project.label }}</span>
            <span v-if="studio.dirty.value" class="size-1.5 shrink-0 rounded-full bg-amber-300" aria-label="Unsaved changes" />
          </Button>
        </template>
        <p class="px-2 pt-1 pb-2 text-[11px] leading-snug text-muted-foreground">{{ where }}</p>
        <div v-if="project.workspace.kind !== 'file'" class="max-h-[46vh] overflow-y-auto">
          <div v-for="[folder, files] in folders" :key="folder" class="mb-1">
            <p v-if="folder" class="px-2 py-1 font-mono text-[10px] text-muted-foreground">{{ folder }}/</p>
            <button
              v-for="path in files"
              :key="path"
              class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
              :class="path === project.current && 'bg-accent'"
              @click="openFile(path)"
            >
              <IHgFile01 class="size-3.5 shrink-0 text-muted-foreground" />
              <span class="truncate">{{ path.slice(folder ? folder.length + 1 : 0) }}</span>
              <span v-if="path === project.current && studio.dirty.value" class="ml-auto size-1.5 shrink-0 rounded-full bg-amber-300" />
            </button>
          </div>
          <p v-if="!project.files.length" class="px-2 py-3 text-center text-xs text-muted-foreground">{{ project.locked ? 'Allow access when your browser asks.' : 'No .aurora files here yet.' }}</p>
          <form class="mt-1 flex gap-1 border-t border-panel-border px-1 pt-2" @submit.prevent="saveAsNamed">
            <input v-model="newName" aria-label="Save as" placeholder="backgrounds/hero.aurora" class="h-7 min-w-0 flex-1 rounded-md bg-input px-2 font-mono text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Button size="sm" variant="subtle" type="submit">Save as</Button>
          </form>
        </div>
        <div class="mt-1.5 flex justify-between border-t border-panel-border pt-1.5">
          <Button v-if="studio.canUseDisk()" size="sm" @click="openFolder"><IHgFolderOpen />Open folder…</Button>
          <span v-else />
          <Button size="sm" @click="() => { studio.disconnect(); browsing = false }">Close</Button>
        </div>
      </Popover>
      <Popover v-else-if="studio.canUseDisk()" v-model:open="opening" align="start" class="w-[260px] p-1.5">
        <template #trigger>
          <Button size="icon-sm" aria-label="Open from this computer"><IHgFolderOpen /></Button>
        </template>
        <button class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-accent" @click="openFromDisk">
          <IHgFile01 class="size-4 text-muted-foreground" />
          <span class="flex-1">Open file…</span>
          <span class="flex gap-0.5"><Kbd>⌘</Kbd><Kbd>O</Kbd></span>
        </button>
        <button class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-accent" @click="openFolder">
          <IHgFolderOpen class="size-4 text-muted-foreground" />
          <span class="flex-1">Open folder…</span>
        </button>
        <p class="px-2 pt-1 pb-1.5 text-[10.5px] leading-snug text-muted-foreground">Files stay on this computer; ⌘S saves them in place.</p>
      </Popover>
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
      <Transition enter-from-class="w-0 opacity-0" leave-to-class="w-0 opacity-0" enter-active-class="transition-all duration-300" leave-active-class="transition-all duration-200">
        <Tip v-if="comparing && score !== undefined" label="How closely the CSS fallback matches WebGPU, by perceptual (ΔE-OK) difference">
          <span class="flex h-7 items-center gap-1.5 overflow-hidden rounded-lg bg-input px-2 text-[11px] whitespace-nowrap text-muted-foreground">
            Fidelity
            <span class="font-mono font-medium tabular" :class="score >= 80 ? 'text-emerald-300' : score >= 60 ? 'text-amber-300' : 'text-[oklch(0.75_0.15_25)]'">{{ score }}%</span>
          </span>
        </Tip>
      </Transition>
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
            <p class="text-xs font-medium">Save {{ project.current ?? studio.fileName.value }}</p>
            <p class="text-[11px] text-muted-foreground">{{ project.current ? (project.workspace?.kind === 'api' ? 'Back to your project; the site hot-reloads' : 'In place, on this computer') : studio.canUseDisk() ? 'Choose where; then ⌘S saves there' : 'Downloads the file' }}</p>
          </div>
          <span class="flex gap-0.5"><Kbd>⌘</Kbd><Kbd>S</Kbd></span>
        </button>
        <button v-if="studio.canUseDisk() || project.current" class="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent" @click="downloadFile">
          <div class="grid size-8 place-items-center rounded-lg bg-input"><IHgDownload04 class="size-4" /></div>
          <div class="flex-1">
            <p class="text-xs font-medium">Download a copy</p>
            <p class="text-[11px] text-muted-foreground">{{ studio.fileName.value }}, ready for the unplugin or &lt;aurora-bg&gt;</p>
          </div>
        </button>
        <button class="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent" @click="poster">
          <div class="grid size-8 place-items-center rounded-lg bg-input"><IHgImage01 class="size-4" /></div>
          <div class="flex-1">
            <p class="text-xs font-medium">Poster PNG</p>
            <p class="text-[11px] text-muted-foreground">One frame at 1200 × 630, for og:image and posters</p>
          </div>
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
