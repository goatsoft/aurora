<script setup lang="ts">
const props = defineProps<{ code: string }>()
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
    class="absolute top-2 right-2 grid size-8 place-items-center rounded-lg border border-border bg-surface/80 text-muted-foreground opacity-0 backdrop-blur-sm transition group-hover/code:opacity-100 hover:text-foreground focus-visible:opacity-100 [.code-block:hover_&]:opacity-100"
    :aria-label="copied ? 'Copied' : 'Copy code'"
    @click="copy"
  >
    <IHgTick02
      v-if="copied"
      class="size-4 text-primary"
    />
    <IHgCopy01
      v-else
      class="size-4"
    />
  </button>
</template>
