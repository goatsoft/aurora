<script setup lang="ts">
/**
 * Tabs over the code blocks gruff renders inside `::: code-group`. The labels come prerendered as
 * `tabs`; the first block shows before hydration, so there is no shift when tabs come alive.
 */
const props = defineProps<{ tabs: string[] }>()
const active = ref(0)
const root = ref<HTMLElement>()
const live = ref(false)

function show(index: number) {
  active.value = index
  root.value?.querySelectorAll<HTMLElement>(':scope > [data-blocks] > .code-block').forEach((block, i) => {
    block.toggleAttribute('data-on', i === index)
  })
}
onMounted(() => {
  show(0)
  live.value = true
})
</script>

<template>
  <div
    ref="root"
    class="my-6 overflow-hidden rounded-xl border border-border bg-surface"
  >
    <div
      role="tablist"
      class="flex gap-1 border-b border-border px-2 pt-2"
    >
      <button
        v-for="(tab, i) in props.tabs"
        :key="tab"
        role="tab"
        :aria-selected="active === i"
        class="relative rounded-t-md px-3 pt-1.5 pb-2 font-mono text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="active === i ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
        @click="show(i)"
      >
        {{ tab }}
        <span
          v-if="active === i"
          class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-linear-to-r from-spectrum-1 to-spectrum-2"
        />
      </button>
    </div>
    <div
      data-blocks
      class="[&_.code-title]:hidden [&>.code-block]:my-0 [&>.code-block]:rounded-none [&>.code-block]:border-0"
      :class="live ? '[&>.code-block:not([data-on])]:hidden' : '[&>.code-block:not(:first-child)]:hidden'"
    >
      <slot />
    </div>
  </div>
</template>
