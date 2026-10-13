<script setup lang="ts">
import { HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
import { glossary } from 'virtual:gruff'

/** A glossary term's first use on a page: a link to its entry, with the definition on hover. */
const props = defineProps<{ id: string }>()
const entry = glossary.find((e) => e.id === props.id)
</script>

<template>
  <HoverCardRoot
    :open-delay="250"
    :close-delay="80"
  >
    <HoverCardTrigger as-child>
      <RouterLink
        :to="`/docs/glossary#${props.id}`"
        class="font-[inherit]! text-inherit! decoration-muted-foreground/60! decoration-dotted! underline-offset-4"
      >
        <slot />
      </RouterLink>
    </HoverCardTrigger>
    <HoverCardPortal>
      <HoverCardContent
        v-if="entry"
        side="top"
        :side-offset="6"
        class="z-50 max-w-xs rounded-xl p-3 text-sm shadow-2xl glass"
      >
        <p class="font-semibold">
          {{ entry.term }}
        </p>
        <p class="mt-1 text-pretty text-muted-foreground">
          {{ entry.definition }}
        </p>
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
