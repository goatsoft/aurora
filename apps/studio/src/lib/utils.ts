import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names, letting later Tailwind utilities override earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
