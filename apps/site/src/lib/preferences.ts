import type { InjectionKey, Ref } from 'vue'
import { inject, onMounted, onScopeDispose, provide, ref } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'

interface SitePreferences {
  paused: Ref<boolean>
  light: Ref<boolean>
  theme: Ref<ThemePreference>
  setTheme: (theme: ThemePreference) => void
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
  const theme = ref<ThemePreference>('system')
  const applyTheme = () => {
    light.value = theme.value === 'light' || (theme.value === 'system' && matchMedia('(prefers-color-scheme: light)').matches)
    document.documentElement.dataset['theme'] = light.value ? 'light' : 'dark'
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) meta.content = light.value ? '#fafafd' : '#090a14'
  }
  const applyMotion = () => {
    document.documentElement.dataset['paused'] = String(paused.value)
  }
  const preferences = {
    paused,
    light,
    theme,
    setTheme(value: ThemePreference) {
      theme.value = value
      write('aurora:theme', value)
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
    const saved = read('aurora:theme')
    theme.value = saved === 'light' || saved === 'dark' ? saved : 'system'
    applyTheme()
    paused.value = read('aurora:paused') === 'true'
    applyMotion()
    media.addEventListener('change', applyTheme)
    cleanup = () => media.removeEventListener('change', applyTheme)
  })
  onScopeDispose(() => cleanup?.())
  provide(key, preferences)
  return preferences
}

export function useSitePreferences(): SitePreferences {
  return inject(key, () => ({ paused: ref(false), light: ref(false), theme: ref<ThemePreference>('system'), setTheme: () => undefined, toggleMotion: () => undefined }), true)
}
