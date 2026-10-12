<script setup lang="ts">
/** A titled group of inspector rows, with an optional action on the right of the title. */
defineProps<{ title: string }>()
</script>

<template>
  <section class="border-t border-panel-border p-3 first:border-t-0">
    <header class="mb-2 flex h-5 items-center justify-between">
      <h3 class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {{ title }}
      </h3>
      <slot name="action" />
    </header>
    <div class="flex flex-col gap-1.5">
      <slot />
    </div>
  </section>
</template>
