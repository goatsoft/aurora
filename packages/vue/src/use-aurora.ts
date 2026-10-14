import type { AuroraMode, AuroraSource, AuroraSurface } from '@goatsoft/aurora'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { mountAurora } from '@goatsoft/aurora'
import { onMounted, onScopeDispose, readonly, ref, shallowRef, toValue, watch } from 'vue'
import { useAuroraScene } from './scene'

export interface UseAuroraOptions {
  /** Reactive playback control; leaves the authored document unchanged. */
  paused?: MaybeRefOrGetter<boolean>
  /** Scene name; defaults to the nearest `<AuroraScene>`. */
  scene?: MaybeRefOrGetter<string | undefined>
  onError?: (error: Error) => void
}

export interface UseAurora {
  /** "css" until a WebGPU frame is on screen, then "webgpu". */
  mode: Readonly<Ref<AuroraMode>>
  /** The live surface, once mounted. */
  surface: Readonly<ShallowRef<AuroraSurface | undefined>>
}

/**
 * Mounts an Aurora background into `target` and keeps it in sync: source changes update in place
 * (no flash), scene changes remount, and it is disposed with the component.
 * `source` may be a document, an imported `.aurora` module, or a URL to load.
 */
export function useAurora(
  target: Readonly<Ref<HTMLElement | null | undefined>>,
  source: MaybeRefOrGetter<AuroraSource | string | undefined>,
  options: UseAuroraOptions = {},
): UseAurora {
  const injected = useAuroraScene()
  const mode = ref<AuroraMode>('css')
  const surface = shallowRef<AuroraSurface>()
  const resolved = shallowRef<AuroraSource>()
  let loads = 0

  const scene = () => toValue(options.scene) ?? injected()

  async function resolve(value: AuroraSource | string | undefined) {
    const load = ++loads
    if (typeof value !== 'string') {
      resolved.value = value
      return
    }
    try {
      const { loadAurora } = await import('@goatsoft/aurora/load')
      const doc = await loadAurora(new URL(value, document.baseURI))
      if (load === loads) resolved.value = doc
    } catch (error) {
      if (load !== loads) return
      const reason = error instanceof Error ? error : new Error(String(error))
      if (options.onError) options.onError(reason)
      else console.error(`useAurora: ${reason.message}`)
    }
  }

  function mount() {
    surface.value?.dispose()
    surface.value = undefined
    mode.value = 'css'
    const el = target.value
    const current = resolved.value
    if (!el || !current) return
    const name = scene()
    surface.value = mountAurora(el, current, {
      paused: toValue(options.paused) ?? false,
      ...(name ? { scene: name } : {}),
      onModeChange: (next) => {
        mode.value = next
      },
      // Why it's on CSS when it could be on WebGPU; the fallback stays on screen regardless.
      ...(options.onError ? { onError: options.onError } : {}),
    })
  }

  onMounted(() => {
    watch(() => toValue(source), (value) => void resolve(value), { immediate: true })
    watch(resolved, (current, previous) => {
      if (current && previous && surface.value) surface.value.update(current)
      else mount()
    }, { immediate: true })
    watch([scene, target], () => mount())
    watch(() => toValue(options.paused), (paused) => {
      if (paused) surface.value?.pause()
      else surface.value?.resume()
    })
  })
  onScopeDispose(() => {
    loads++
    surface.value?.dispose()
    surface.value = undefined
  })

  return { mode: readonly(mode), surface }
}
