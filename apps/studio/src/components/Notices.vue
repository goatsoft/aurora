<script setup lang="ts">
import { useStudio } from '@/editor/studio'

const { ui } = useStudio()
</script>

<template>
  <div
    class="pointer-events-none absolute bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup
      enter-from-class="translate-y-2 scale-95 opacity-0"
      leave-to-class="scale-95 opacity-0"
      enter-active-class="transition duration-300 ease-[cubic-bezier(0.2,0.9,0.1,1)]"
      leave-active-class="transition duration-200"
    >
      <div
        v-for="notice in ui.notices"
        :key="notice.id"
        class="flex max-w-[560px] items-center gap-2 rounded-xl glass px-3.5 py-2 text-xs"
        :class="notice.tone === 'error' && 'border-destructive/40 text-[oklch(0.85_0.08_25)]'"
      >
        <IHgCancelCircle
          v-if="notice.tone === 'error'"
          class="size-4 shrink-0"
        />
        <IHgTick02
          v-else
          class="size-4 shrink-0 text-emerald-300"
        />
        {{ notice.message }}
      </div>
    </TransitionGroup>
  </div>
</template>
