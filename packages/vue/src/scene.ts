import type { InjectionKey } from 'vue'
import { inject } from 'vue'

export const SCENE: InjectionKey<() => string | undefined> = Symbol('aurora-scene')

/** The scene name provided by the nearest `<AuroraScene>`, if any. */
export function useAuroraScene(): () => string | undefined {
  return inject(SCENE, () => undefined)
}
