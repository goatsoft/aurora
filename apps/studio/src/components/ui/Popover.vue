<script setup lang="ts">
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'

defineProps<{ side?: 'top' | 'bottom' | 'left' | 'right', align?: 'start' | 'center' | 'end', class?: string }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side="side ?? 'bottom'"
        :align="align ?? 'center'"
        :side-offset="8"
        :collision-padding="12"
        class="z-50 rounded-xl glass p-3 outline-none data-[state=open]:animate-[pop-in_160ms_cubic-bezier(0.2,0.9,0.1,1)]"
        :class="$props.class"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
