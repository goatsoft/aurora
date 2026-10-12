<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

/** A tooltip with an optional keyboard shortcut, e.g. `<Tip label="Undo" keys="⌘Z">`. */
defineProps<{ label: string, keys?: string | undefined, side?: 'top' | 'bottom' | 'left' | 'right' | undefined }>()
</script>

<template>
  <TooltipRoot :delay-duration="350">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        :side="side ?? 'bottom'"
        :side-offset="8"
        class="z-50 flex items-center gap-2 rounded-md border border-panel-border bg-[oklch(0.2_0.02_270/0.95)] px-2 py-1 text-xs text-foreground shadow-lg backdrop-blur-xl data-[state=delayed-open]:animate-[pop-in_120ms_ease-out]"
      >
        {{ label }}
        <span v-if="keys" class="flex gap-0.5">
          <Kbd v-for="key in keys.split(' ')" :key="key">{{ key }}</Kbd>
        </span>
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
