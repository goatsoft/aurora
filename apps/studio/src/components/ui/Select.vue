<script setup lang="ts" generic="T extends string">
import { SelectContent, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'

defineProps<{ options: { value: T, label: string, hint?: string }[], label: string }>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger
      :aria-label="label"
      class="flex h-7 w-full items-center justify-between gap-2 rounded-md bg-input px-2 text-xs text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SelectValue />
      <IHgUnfoldMore class="size-3.5 text-muted-foreground" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        class="z-50 min-w-(--reka-select-trigger-width) overflow-hidden rounded-lg glass p-1"
      >
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            class="relative flex cursor-default items-center justify-between gap-4 rounded-md py-1.5 pr-2 pl-6 text-xs outline-none select-none data-highlighted:bg-accent"
          >
            <SelectItemIndicator class="absolute left-1.5">
              <IHgTick02 class="size-3.5 text-primary" />
            </SelectItemIndicator>
            <SelectItemText>{{ option.label }}</SelectItemText>
            <span
              v-if="option.hint"
              class="text-muted-foreground"
            >{{ option.hint }}</span>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
