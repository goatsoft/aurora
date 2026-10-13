<script setup lang="ts">
/**
 * Text you can click and type over, in place. Commits on blur or Enter; Escape puts it back; an
 * emptied field goes back to its default. Plain text only: pasted formatting is dropped.
 */
const props = defineProps<{ as?: string, label: string, fallback: string, multiline?: boolean }>()
const model = defineModel<string>({ required: true })
const el = ref<HTMLElement>()
// The element's text is set from the model here, not rendered, so typing isn't fought by Vue.
watch([el, model], () => {
  if (el.value && document.activeElement !== el.value) el.value.textContent = model.value
}, { immediate: true })

function commit() {
  const text = (el.value?.textContent ?? '').replace(/\s+/g, ' ').trim()
  model.value = text || props.fallback
  if (el.value) el.value.textContent = model.value
}
function key(event: KeyboardEvent) {
  if (event.key === 'Enter' && !(props.multiline && event.shiftKey)) {
    event.preventDefault()
    el.value?.blur()
  } else if (event.key === 'Escape') {
    if (el.value) el.value.textContent = model.value
    el.value?.blur()
  }
  // Keys typed here are text, not Studio shortcuts.
  event.stopPropagation()
}
</script>

<template>
  <component
    :is="as ?? 'span'"
    ref="el"
    contenteditable="plaintext-only"
    role="textbox"
    :aria-label="label"
    spellcheck="false"
    class="pointer-events-auto cursor-text rounded-md decoration-current/40 decoration-dashed underline-offset-[0.2em] transition-shadow outline-none hover:underline focus:underline-offset-[0.2em] focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
    @blur="commit"
    @keydown="key"
    @pointerdown.stop
  />
</template>
