import type { InjectionKey, Ref } from 'vue'
import { inject, onMounted, onScopeDispose, provide, ref } from 'vue'

interface SitePreferences {
  paused: Ref<boolean>
  light: Ref<boolean>
  toggleTheme: () => void
  toggleMotion: () => void
}
const key: InjectionKey<SitePreferences> = Symbol('site preferences')
const read = (name: string) => {
  try {
    return localStorage.getItem(name)
  } catch {
    return null
  }
}
const write = (name: string, value: string) => {
  try {
    localStorage.setItem(name, value)
  } catch { /* Preferences still work without storage. */ }
}

export function provideSitePreferences() {
  const paused = ref(false)
  const light = ref(false)
  const applyTheme = () => {
    document.documentElement.dataset['theme'] = light.value ? 'light' : 'dark'
  }
  const applyMotion = () => {
    document.documentElement.dataset['paused'] = String(paused.value)
  }
  const preferences = {
    paused,
    light,
    toggleTheme() {
      light.value = !light.value
      write('aurora:theme', light.value ? 'light' : 'dark')
      applyTheme()
    },
    toggleMotion() {
      paused.value = !paused.value
      write('aurora:paused', String(paused.value))
      applyMotion()
    },
  }
  let cleanup: (() => void) | undefined
  onMounted(() => {
    const media = matchMedia('(prefers-color-scheme: light)')
    const sync = () => {
      const theme = read('aurora:theme')
      light.value = theme === 'light' || (theme !== 'dark' && media.matches)
      applyTheme()
    }
    sync()
    paused.value = read('aurora:paused') === 'true'
    applyMotion()
    media.addEventListener('change', sync)
    cleanup = () => media.removeEventListener('change', sync)
  })
  onScopeDispose(() => cleanup?.())
  provide(key, preferences)
  return preferences
}

export function useSitePreferences(): SitePreferences {
  return inject(key, () => ({ paused: ref(false), light: ref(false), toggleTheme: () => undefined, toggleMotion: () => undefined }), true)
}
