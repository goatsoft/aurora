<script setup lang="ts">
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import type { PrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-[color,background-color,box-shadow,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_0_0_1px_oklch(1_0_0/0.12)_inset,0_6px_20px_-6px_var(--primary)] hover:brightness-110',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground data-[state=on]:bg-accent data-[state=on]:text-foreground',
        subtle: 'bg-input text-foreground hover:bg-accent',
      },
      size: {
        default: 'h-8 px-3',
        sm: 'h-7 px-2.5 text-xs',
        icon: 'size-8',
        'icon-sm': 'size-7 [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'default' },
  },
)
type ButtonVariants = VariantProps<typeof button>

const props = withDefaults(defineProps<PrimitiveProps & {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: string | false | undefined
}>(), { as: 'button' })
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" :class="cn(button({ variant: props.variant, size: props.size }), props.class || undefined)">
    <slot />
  </Primitive>
</template>
