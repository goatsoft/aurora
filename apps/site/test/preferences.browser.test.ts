import type { Oklab } from '@goatsoft/color'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { contrastRatio, parseColor } from '@goatsoft/color'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import LazyBackground from '@/components/LazyBackground.vue'
import PillarsSection from '@/components/section/PillarsSection.vue'
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
      prefersLight = false
      media.dispatchEvent(new MediaQueryListEvent('change', { matches: false, media: media.media }))
      expect(document.documentElement.dataset['theme']).toBe('dark')
      await wrapper.get('button[aria-label="Use light theme"]').trigger('click')
      media.dispatchEvent(new MediaQueryListEvent('change', { matches: false, media: media.media }))
      expect(document.documentElement.dataset['theme']).toBe('light')
    } finally { wrapper.unmount() }
    expect(removed).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('restores a theme, keeps focus visible and preserves playback across remounts', async () => {
    localStorage.setItem('aurora:theme', 'dark')
    let wrapper = mountPreferences()
    try {
      await vi.waitFor(() => expect(wrapper.findComponent(AuroraBackground).exists()).toBe(true))
      const theme = wrapper.get('button[aria-label="Use light theme"]')
      ;(theme.element as HTMLButtonElement).focus()
      expect(getComputedStyle(theme.element).outlineStyle).not.toBe('none')
      await theme.trigger('click')
      expect(document.documentElement.dataset['theme']).toBe('light')
      expect(wrapper.find('button[aria-label="Use dark theme"]').exists()).toBe(true)
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
      await wrapper.findAll('button').find((button) => button.attributes('aria-label')?.includes('theme'))!.trigger('click')
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
