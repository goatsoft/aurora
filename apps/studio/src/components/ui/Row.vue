<script setup lang="ts">
/** One inspector row: a label on the left, its control on the right, tied together for screen readers. */
defineProps<{ label: string, hint?: string | undefined }>()
const id = useId()
</script>

<template>
  <div class="grid min-h-7 grid-cols-[5.5rem_1fr] items-center gap-2">
    <span :id="id" class="truncate text-xs text-muted-foreground" :title="hint">{{ label }}</span>
    <div role="group" :aria-labelledby="id" :aria-description="hint">
      <slot />
    </div>
  </div>
</template>
