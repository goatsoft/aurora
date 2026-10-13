<script setup lang="ts">
import type { TocEntry } from '@goatsoft/gruff'

/** "On this page", with the heading you're reading highlighted. */
const props = defineProps<{ entries: TocEntry[] }>()
const active = ref<string>()

function update() {
  let current: string | undefined
  for (const entry of props.entries) {
    const el = document.getElementById(entry.id)
    if (el && el.getBoundingClientRect().top < 140) current = entry.id
  }
  active.value = current ?? props.entries[0]?.id
}
onMounted(update)
useEventListener('scroll', update, { passive: true })
watch(() => props.entries, () => nextTick(update))
</script>

<template>
  <aside
    v-if="props.entries.length"
    class="sticky top-28 max-h-[calc(100dvh-7rem)] self-start overflow-y-auto overscroll-contain pb-8"
  >
    <p class="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted-foreground/80 uppercase">
      On this page
    </p>
    <ul class="space-y-1 border-l border-border text-[13px]">
      <li
        v-for="entry in props.entries"
        :key="entry.id"
      >
        <a
          :href="`#${entry.id}`"
          class="-ml-px block border-l py-1 transition-colors"
          :class="[entry.level === 3 ? 'pl-6' : 'pl-3', active === entry.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground']"
        >{{ entry.text }}</a>
      </li>
    </ul>
  </aside>
</template>
