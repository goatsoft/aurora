import { useMediaQuery } from '@vueuse/core'

/** Below Tailwind's `md`: panels become sheets at the bottom and the canvas fills the screen. */
export const useCompact = () => useMediaQuery('(max-width: 767px)')
