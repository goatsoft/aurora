<script setup lang="ts">
import type { AuroraDocument } from '@goatsoft/aurora-format'
import { validateDocument } from '@goatsoft/aurora'
import { encodeShare } from '@goatsoft/aurora-editor-ui'
import { parseAurora } from '@goatsoft/aurora-format'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { useSitePreferences } from '@/lib/preferences'

/**
 * An `aurora` fence: the background running live above its source. "Edit" makes the source a text
 * area; valid edits apply as you type, and the first problem shows under it.
 */
const props = defineProps<{ source: string, code: string }>()

const text = ref(props.source)
const editing = ref(false)
const error = ref<string>()

function parse(value: string): AuroraDocument | undefined {
  const parsed = parseAurora(value)
  return parsed.ok ? parsed.doc : undefined
}
const doc = shallowRef<AuroraDocument | undefined>(parse(props.source))

watchDebounced(text, async (value) => {
  const parsed = parseAurora(value)
  const issues = parsed.ok ? await validateDocument(parsed.doc) : parsed.issues
  error.value = issues[0] && `${issues[0].path || 'document'}: ${issues[0].message}`
  if (parsed.ok && !issues.length) doc.value = parsed.doc
}, { debounce: 200 })

/** Opens the current document in Studio, as a share link. */
async function openInStudio() {
  if (!doc.value) return
  window.open(`/studio/#${await encodeShare(doc.value)}`, '_blank', 'noopener')
}

const { paused: sitePaused } = useSitePreferences()
</script>

<template>
  <figure
    data-scene-theme
    class="my-6 overflow-hidden rounded-xl border border-border bg-[oklch(0.1_0.02_272)] text-foreground"
  >
    <div class="relative isolate h-56 overflow-hidden border-b border-border sm:h-72">
      <AuroraBackground
        v-if="doc"
        :paused="sitePaused"
        :src="doc"
      />
      <div class="absolute top-3 right-3 flex items-center gap-2">
        <PlaybackToggle />
        <Button
          size="sm"
          variant="glass"
          @click="openInStudio"
        >
          <IHgPaintBoard /> Studio
        </Button>
        <Button
          size="sm"
          variant="glass"
          @click="editing = !editing"
        >
          <IHgPencilEdit02 /> {{ editing ? 'Done' : 'Edit' }}
        </Button>
      </div>
    </div>
    <div v-if="editing">
      <textarea
        v-model="text"
        spellcheck="false"
        aria-label="Aurora document"
        class="block min-h-64 w-full resize-y bg-transparent p-4 font-mono text-[13px]/6 text-foreground outline-none"
      />
      <p
        v-if="error"
        class="border-t border-border px-4 py-2 text-xs text-rose-300"
      >
        {{ error }}
      </p>
    </div>
    <!-- eslint-disable vue/no-v-html -- Shiki's output, highlighted at build time from the page's own source. -->
    <div
      v-else
      class="max-h-80 overflow-auto p-4 font-mono text-[13px]/6 [&_pre]:bg-transparent!"
      v-html="props.code"
    />
    <!-- eslint-enable vue/no-v-html -->
  </figure>
</template>
