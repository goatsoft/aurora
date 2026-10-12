<script setup lang="ts" generic="T extends string">
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'

/** A segmented control. Each option is an icon or text; the active one sits on a sliding pill. */
const props = defineProps<{ options: { value: T, label: string, keys?: string }[], size?: 'sm' }>()
const model = defineModel<T>({ required: true })
const index = computed(() => Math.max(0, props.options.findIndex((o) => o.value === model.value)))
const item = computed(() => ['relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:text-foreground [&_svg]:size-4', props.size === 'sm' ? 'h-6 text-xs' : 'h-7'])
</script>

<template>
  <ToggleGroupRoot
    type="single"
    :model-value="model"
    class="relative flex rounded-lg bg-input p-0.5"
    @update:model-value="(v) => v && (model = v as T)"
  >
    <div
      class="absolute top-0.5 bottom-0.5 left-0.5 rounded-md bg-[oklch(1_0_0/0.11)] shadow-[0_1px_0_oklch(1_0_0/0.08)_inset] transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.1,1)]"
      :style="{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${index * 100}%)` }"
    />
    <template v-for="option in options" :key="option.value">
      <!-- Text options say what they are; icon options and shortcuts get a tooltip. -->
      <Tip v-if="$slots[option.value] || option.keys" :label="option.label" :keys="option.keys">
        <ToggleGroupItem :value="option.value" :aria-label="option.label" :class="item">
          <slot :name="option.value">{{ option.label }}</slot>
        </ToggleGroupItem>
      </Tip>
      <ToggleGroupItem v-else :value="option.value" :class="item">{{ option.label }}</ToggleGroupItem>
    </template>
  </ToggleGroupRoot>
</template>
