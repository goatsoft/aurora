<script setup lang="ts">
import type { SearchDocument } from '@goatsoft/gruff'
import MiniSearch from 'minisearch'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
import { searchFields, searchIndex } from 'virtual:gruff'

/** Docs search: the build-time index, loaded on first open; ⌘K or / opens it. */
const open = ref(false)
const query = ref('')
const selected = ref(0)
const router = useRouter()
let index: MiniSearch<SearchDocument> | undefined

const results = computed(() => {
  if (!open.value || !query.value.trim()) return []
  index ??= MiniSearch.loadJSON<SearchDocument>(searchIndex, searchFields)
  return index.search(query.value, { prefix: true, fuzzy: 0.2, boost: { title: 3, section: 2 } }).slice(0, 8)
    .map((r) => ({ id: String(r.id), title: String(r['title']), section: String(r['section'] ?? '') }))
})
watch(results, () => (selected.value = 0))

function go(id: string | undefined) {
  if (!id) return
  open.value = false
  query.value = ''
  void router.push(id)
}

const isMac = ref(true)
onMounted(() => (isMac.value = /Mac|iP/.test(navigator.userAgent)))
useEventListener('keydown', (event: KeyboardEvent) => {
  const typing = event.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(event.target.tagName)
  if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
    event.preventDefault()
    open.value = true
  }
})
function keys(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') selected.value = Math.min(selected.value + 1, results.value.length - 1)
  else if (event.key === 'ArrowUp') selected.value = Math.max(selected.value - 1, 0)
  else if (event.key === 'Enter') go(results.value[selected.value]?.id)
  else return
  event.preventDefault()
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger class="flex w-full items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <IHgSearch01 class="size-4" /> Search docs
      <kbd class="ml-auto rounded-sm border border-border px-1.5 font-mono text-[11px]">{{ isMac ? '⌘' : 'Ctrl ' }}K</kbd>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" />
      <DialogContent
        class="fixed top-[14vh] left-1/2 z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl shadow-2xl glass"
        @keydown="keys"
      >
        <DialogTitle class="sr-only">
          Search the docs
        </DialogTitle>
        <div class="flex items-center gap-3 border-b border-border px-4">
          <IHgSearch01 class="size-5 text-muted-foreground" />
          <input
            v-model="query"
            placeholder="Search the docs"
            aria-label="Search"
            class="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          >
        </div>
        <ul
          v-if="results.length"
          class="max-h-[50vh] overflow-y-auto p-2"
          role="listbox"
        >
          <li
            v-for="(result, i) in results"
            :key="result.id"
            role="option"
            :aria-selected="i === selected"
          >
            <button
              class="w-full rounded-lg px-3 py-2.5 text-left"
              :class="i === selected && 'bg-white/8'"
              @mouseenter="selected = i"
              @click="go(result.id)"
            >
              <span class="block text-sm font-medium">{{ result.section || result.title }}</span>
              <span
                v-if="result.section"
                class="block text-xs text-muted-foreground"
              >{{ result.title }}</span>
            </button>
          </li>
        </ul>
        <p
          v-else-if="query.trim()"
          class="p-6 text-center text-sm text-muted-foreground"
        >
          Nothing for “{{ query }}”.
        </p>
        <p
          v-else
          class="p-6 text-center text-sm text-muted-foreground"
        >
          Guides, generators, the format and every decision.
        </p>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
