<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

defineProps<{ label: string }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <SwitchRoot
    v-model="model"
    :aria-label="label"
    class="relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full bg-input transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-primary"
  >
    <SwitchThumb class="block size-3.5 translate-x-0.5 rounded-full bg-foreground shadow transition-transform duration-200 ease-[cubic-bezier(0.2,0.9,0.1,1)] data-[state=checked]:translate-x-4 data-[state=checked]:bg-primary-foreground" />
  </SwitchRoot>
</template>
