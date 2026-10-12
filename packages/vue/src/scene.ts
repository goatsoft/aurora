import { defineComponent, inject, provide } from 'vue'
import type { InjectionKey, PropType } from 'vue'

export const SCENE: InjectionKey<() => string | undefined> = Symbol('aurora-scene')

/** The scene name provided by the nearest `<AuroraScene>`, if any. */
export function useAuroraScene(): () => string | undefined {
  return inject(SCENE, () => undefined)
}

/**
 * Puts every `<AuroraBackground>` inside it into one scene: one clock and one continuous field
 * across separate panels. Renders no element of its own.
 */
export const AuroraScene = defineComponent({
  name: 'AuroraScene',
  props: {
    name: { type: String as PropType<string>, required: true },
  },
  setup(props, { slots }) {
    provide(SCENE, () => props.name)
    return () => slots['default']?.()
  },
})
