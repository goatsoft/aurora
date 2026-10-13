<script setup lang="ts">
import type { BadgeLabel, BadgeLayout, BadgeTheme } from '@goatsoft/aurora/badge'
import { auroraBadge } from '@goatsoft/aurora/badge'
import { computed, ref } from 'vue'
import { badgeSnippet } from '@/lib/badge-snippet'
import highlights from 'virtual:badge-snippets'

const layout = ref<BadgeLayout>('inline')
const theme = ref<BadgeTheme>('auto')
const animated = ref(false)
const format = ref<'Vue' | 'HTML' | 'Markdown'>('Vue')
const message = ref('')
const labels: BadgeLabel[] = ['made-with', 'powered-by', 'enabled']
const examples = computed(() => labels.map((label) => {
  const options = { label, layout: layout.value, theme: theme.value, animated: animated.value }
  const badge = auroraBadge(options)
  const local = auroraBadge({ ...options, baseUrl: '/badges/v1' })
  const snippet = badgeSnippet(options)[format.value]
  return { label, badge, local, snippet, highlighted: highlights[snippet] }
}))

async function copy(code: string, label: string) {
  try {
    await navigator.clipboard.writeText(code)
    message.value = `Copied ${label} ${format.value} snippet.`
  } catch {
    message.value = 'Copy unavailable. Select the snippet and copy it manually.'
  }
}
</script>

<template>
  <div class="my-6 space-y-4">
    <div class="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4 text-sm">
      <label class="grid gap-2">Layout
        <select
          v-model="layout"
          class="rounded-md border border-border bg-background px-3 py-2"
        >
          <option value="inline">Inline</option><option value="stacked">Stacked</option>
        </select>
      </label>
      <label class="grid gap-2">Theme
        <select
          v-model="theme"
          class="rounded-md border border-border bg-background px-3 py-2"
        >
          <option value="auto">Auto</option><option value="light">Light</option><option value="dark">Dark</option>
        </select>
      </label>
      <label class="grid gap-2">Snippet
        <select
          v-model="format"
          class="rounded-md border border-border bg-background px-3 py-2"
        >
          <option>Vue</option><option>HTML</option><option>Markdown</option>
        </select>
      </label>
      <label class="flex items-center gap-2 py-2"><input
        v-model="animated"
        type="checkbox"
      > Animated glow</label>
    </div>
    <article
      v-for="example in examples"
      :key="example.label"
      class="overflow-hidden rounded-xl border border-border"
    >
      <div
        class="flex min-h-24 flex-wrap items-center justify-between gap-4 p-5"
        :class="theme === 'light' ? 'bg-white' : 'bg-background'"
      >
        <a
          :href="example.badge.href"
          class="inline-flex rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <img
            :src="example.local.src"
            :alt="example.badge.alt"
            :width="example.badge.width"
            :height="example.badge.height"
          >
        </a>
        <a
          :href="example.local.src"
          :download="`${example.label}.svg`"
          class="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground hover:text-primary"
        >Download SVG</a>
      </div>
      <div class="border-t border-border bg-surface p-4">
        <div class="mb-3 flex items-center justify-between gap-4 text-xs">
          <span class="text-muted-foreground">{{ example.badge.alt }} · {{ format }}</span>
          <button
            type="button"
            class="rounded-md border border-border px-3 py-2 hover:text-primary"
            :aria-label="`Copy ${example.badge.alt} ${format} snippet`"
            @click="copy(example.snippet, example.badge.alt)"
          >
            Copy snippet
          </button>
        </div>
        <!-- eslint-disable vue/no-v-html -- Shiki output generated from our own fixed badge snippets at build time. -->
        <div
          class="overflow-x-auto font-mono text-[13px]/6"
          v-html="example.highlighted"
        />
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </article>
    <p
      role="status"
      class="min-h-5 text-sm text-muted-foreground"
    >
      {{ message }}
    </p>
  </div>
</template>
