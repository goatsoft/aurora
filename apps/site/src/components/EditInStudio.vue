<script setup lang="ts">
import type { AuroraModule } from '@goatsoft/aurora'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import PencilEdit from '~icons/hugeicons/pencil-edit-02'
import { useStudioHref } from '@/lib/studio-link'

/**
 * A small round button, top right of its positioned parent, that opens the background in Studio.
 * Hidden on phones: Studio works there but is made for a bigger screen, so the page doesn't push it.
 */
const props = defineProps<{ src: AuroraModule | AuroraDocument, label?: string, position?: string, inline?: boolean }>()
const name = computed(() => props.label ?? ('doc' in props.src ? props.src.doc : props.src).name)
const href = useStudioHref(() => props.src)
</script>

<template>
  <a
    :href="href"
    :aria-label="`Edit ${name} in Studio`"
    :title="`Edit ${name} in Studio`"
    :class="inline ? 'relative size-11' : ['absolute size-9', position ?? 'top-3 right-3']"
    class="z-10 hidden place-items-center rounded-full bg-black/35 text-white/85 ring-1 ring-white/15 backdrop-blur-md transition-colors outline-none hover:bg-black/55 hover:text-white focus-visible:ring-2 focus-visible:ring-ring sm:grid"
  >
    <PencilEdit
      class="size-4"
      aria-hidden="true"
    />
  </a>
</template>
