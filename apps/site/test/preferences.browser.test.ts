import type { Oklab } from '@goatsoft/color'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { contrastRatio, parseColor } from '@goatsoft/color'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import CodeGroup from '@/components/doc/CodeGroup.vue'
import LazyBackground from '@/components/LazyBackground.vue'
import PillarsSection from '@/components/section/PillarsSection.vue'
import SharedSection from '@/components/section/SharedSection.vue'
import SiteNav from '@/components/SiteNav.vue'
import { interactionCards } from '@/lib/interactions'
import { provideSitePreferences } from '@/lib/preferences'
import '@/main.css'

const Harness = defineComponent({
  setup() {
    provideSitePreferences()
    return () => h('div', [h(SiteNav), h('div', { class: 'relative h-20' }, [h(LazyBackground, { src: interactionCards[0]!.scene })])])
  },
})
const mountPreferences = () => mount(Harness, { attachTo: document.body, global: { stubs: { RouterLink: RouterLinkStub, AuroraBackground: true } } })
const color = (token: string): Oklab => {
  const parsed = parseColor(getComputedStyle(document.documentElement).getPropertyValue(token))
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.color
}

afterEach(() => {
  localStorage.removeItem('aurora:theme')
  localStorage.removeItem('aurora:paused')
  delete document.documentElement.dataset['theme']
  delete document.documentElement.dataset['paused']
  vi.restoreAllMocks()
})

describe('site accessibility preferences', () => {
  it('follows system theme changes until the visitor makes a choice, then removes its listener', async () => {
    const nativeMatchMedia = window.matchMedia.bind(window)
    const media = nativeMatchMedia('(prefers-color-scheme: light)')
    let prefersLight = true
    vi.spyOn(media, 'matches', 'get').mockImplementation(() => prefersLight)
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => query === media.media ? media : nativeMatchMedia(query))
    const removed = vi.spyOn(media, 'removeEventListener')
    const wrapper = mountPreferences()
    try {
      expect(document.documentElement.dataset['theme']).toBe('light')
      expect(wrapper.get('select').element.value).toBe('system')
      prefersLight = false
      media.dispatchEvent(new MediaQueryListEvent('change', { matches: false, media: media.media }))
      expect(document.documentElement.dataset['theme']).toBe('dark')
      await wrapper.get('select').setValue('light')
      media.dispatchEvent(new MediaQueryListEvent('change', { matches: false, media: media.media }))
      expect(document.documentElement.dataset['theme']).toBe('light')
      await wrapper.get('select').setValue('system')
      expect(document.documentElement.dataset['theme']).toBe('dark')
      expect(localStorage.getItem('aurora:theme')).toBe('system')
    } finally { wrapper.unmount() }
    expect(removed).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('restores a theme, keeps focus visible and preserves playback across remounts', async () => {
    localStorage.setItem('aurora:theme', 'dark')
    let wrapper = mountPreferences()
    try {
      await vi.waitFor(() => expect(wrapper.findComponent(AuroraBackground).exists()).toBe(true))
      const theme = wrapper.get('select')
      ;(theme.element as HTMLSelectElement).focus()
      expect(getComputedStyle(theme.element.parentElement!).outlineStyle).not.toBe('none')
      await theme.setValue('light')
      expect(document.documentElement.dataset['theme']).toBe('light')
      expect(wrapper.get('select').element.value).toBe('light')
      await wrapper.get('button[aria-label="Pause animations"]').trigger('click')
      expect(wrapper.getComponent(AuroraBackground).props('paused')).toBe(true)
      expect(document.documentElement.dataset['paused']).toBe('true')
      wrapper.unmount()
      wrapper = mountPreferences()
      await vi.waitFor(() => expect(wrapper.findComponent(AuroraBackground).exists()).toBe(true))
      expect(document.documentElement.dataset['theme']).toBe('light')
      expect(wrapper.getComponent(AuroraBackground).props('paused')).toBe(true)
      await wrapper.get('button[aria-label="Resume animations"]').trigger('click')
      expect(wrapper.getComponent(AuroraBackground).props('paused')).toBe(false)
    } finally { wrapper.unmount() }
  })

  it('works when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage disabled') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage disabled') })
    const wrapper = mountPreferences()
    try {
      await wrapper.get('select').setValue('light')
      expect(['light', 'dark']).toContain(document.documentElement.dataset['theme'])
      await wrapper.get('button[aria-label="Pause animations"]').trigger('click')
      expect(document.documentElement.dataset['paused']).toBe('true')
    } finally { wrapper.unmount() }
  })

  it.each(['light', 'dark'])('keeps text and focus colours readable in the %s theme', (theme) => {
    document.documentElement.dataset['theme'] = theme
    for (const background of ['--background', '--surface']) {
      for (const ink of ['--foreground', '--muted-foreground', '--primary', '--spectrum-1', '--spectrum-2', '--spectrum-3']) {
        expect(contrastRatio(color(ink), color(background)), `${ink} on ${background}`).toBeGreaterThanOrEqual(4.5)
      }
      expect(contrastRatio(color('--ring'), color(background))).toBeGreaterThanOrEqual(3)
    }
    expect(contrastRatio(color('--primary'), color('--primary-foreground'))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['light', 'dark'])('keeps code tabs and menus opaque, and shared artwork dark, in %s mode', async (theme) => {
    localStorage.setItem('aurora:theme', theme)
    document.documentElement.dataset['theme'] = theme
    const preferences = mountPreferences()
    const code = mount(CodeGroup, { props: { tabs: ['Vue', 'HTML'] }, attachTo: document.body })
    const shared = mount(SharedSection, { attachTo: document.body, global: { stubs: { AuroraBackground: true, EditInStudio: true, RouterLink: RouterLinkStub }, directives: { reveal: {} } } })
    const parsed = (value: string) => {
      const result = parseColor(value)
      if (!result.ok) throw new Error(result.message)
      return result.color
    }
    const readable = (container: Element, ink: Element) => {
      const background = parsed(getComputedStyle(container).backgroundColor)
      expect(background.alpha).toBe(1)
      expect(contrastRatio(parsed(getComputedStyle(ink).color), background)).toBeGreaterThanOrEqual(4.5)
    }
    try {
      for (const tab of code.findAll('[role="tab"]')) readable(code.get('div').element, tab.element)
      const nav = preferences.get('nav[aria-label="Main"]')
      readable(nav.element, preferences.get('a[aria-label="Aurora home"]').element)
      await preferences.get('button[aria-label="Open menu"]').trigger('click')
      const menu = preferences.get('#mobile-navigation')
      for (const link of menu.findAll('a')) readable(menu.element, link.element)
      expect(shared.findAll('[data-scene-theme]')).toHaveLength(3)
      for (const card of shared.findAll('[data-scene-theme]')) {
        readable(card.element, card.get('h3').element)
        expect(parsed(getComputedStyle(card.element).backgroundColor).l).toBeLessThan(0.2)
      }
    } finally {
      preferences.unmount()
      code.unmount()
      shared.unmount()
    }
  })

  it('describes shipping features without making an unverified compliance claim', () => {
    const wrapper = mount(PillarsSection, { global: { directives: { reveal: {} } } })
    try {
      expect(wrapper.findAll('article')).toHaveLength(6)
      expect(wrapper.text()).toContain('prefers-reduced-motion')
      expect(wrapper.text()).toContain('light or dark pages')
      expect(wrapper.text()).toContain('CSS gradient')
      expect(wrapper.text()).not.toContain('WCAG compliant')
    } finally { wrapper.unmount() }
  })
})
