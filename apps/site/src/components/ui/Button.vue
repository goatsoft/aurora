<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority'
import type { Component } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[color,background-color,box-shadow,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_0_0_1px_oklch(1_0_0/0.15)_inset,0_8px_24px_-12px_var(--primary)] hover:brightness-110',
        glass: 'text-foreground glass hover:bg-white/10',
        ghost: 'text-muted-foreground hover:text-foreground',
      },
      size: {
        sm: 'h-9 px-4 text-sm [&_svg]:size-4',
        default: 'h-11 px-6 text-[15px] [&_svg]:size-4.5',
        lg: 'h-14 px-8 text-lg [&_svg]:size-5',
        icon: 'size-10 [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)
type Variants = VariantProps<typeof button>

// A plain dynamic element rather than reka-ui's Primitive, which would pull its shared chunk onto every page.
const props = withDefaults(defineProps<{ as?: string | Component, variant?: Variants['variant'], size?: Variants['size'], class?: string | undefined }>(), { as: 'button' })
</script>

<template>
  <component
    :is="props.as"
    :class="cn(button({ variant: props.variant, size: props.size }), props.class)"
  >
    <slot />
  </component>
</template>
