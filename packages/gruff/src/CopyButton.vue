<script setup lang="ts">
import { ref } from 'vue'
import { useDocs } from './docs'

// Top right of a code block; on a block with a file name it sits inside the name's bar.
const props = defineProps<{ code: string }>()
const { icons } = useDocs()
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  await navigator.clipboard.writeText(props.code)
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <button
    class="absolute top-2 right-2 grid size-8 place-items-center rounded-lg border border-border bg-surface/80 text-muted-foreground opacity-0 backdrop-blur-sm transition group-hover/code:opacity-100 hover:text-foreground focus-visible:opacity-100 [.code-block:hover_&]:opacity-100 [[data-title]>&]:top-1 [[data-title]>&]:size-6 [[data-title]>&]:rounded-md [[data-title]>&_svg]:size-3.5"
    :aria-label="copied ? 'Copied' : 'Copy code'"
    @click="copy"
  >
    <component
      :is="icons.check"
      v-if="copied"
      class="size-4 text-primary"
    />
    <component
      :is="icons.copy"
      v-else
      class="size-4"
    />
  </button>
</template>
