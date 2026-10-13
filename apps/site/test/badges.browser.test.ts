import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import BadgeExamples from '@/components/doc/BadgeExamples.vue'

describe('badge examples', () => {
  it('updates previews, downloads and copyable snippets for every label', async () => {
    const clipboard = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    const wrapper = mount(BadgeExamples)
    try {
      expect(wrapper.findAll('article')).toHaveLength(3)
      const selects = wrapper.findAll('select')
      await selects[0]!.setValue('stacked')
      await selects[1]!.setValue('light')
      await selects[2]!.setValue('HTML')
      await wrapper.get('input').setValue(true)
      for (const [i, label] of ['made-with', 'powered-by', 'enabled'].entries()) {
        const card = wrapper.findAll('article')[i]!
        expect(card.get('img').attributes('src')).toBe(`/badges/v1/${label}-light-animated.svg`)
        expect(card.get('img').attributes('height')).toBe('48')
        expect(card.get('a[download]').attributes('href')).toBe(`/badges/v1/${label}-light-animated.svg`)
        expect(card.get('code').text()).toContain(`https://aurora.goatsoft.io/badges/v1/${label}-light-animated.svg`)
        await card.get('button').trigger('click')
        expect(clipboard).toHaveBeenLastCalledWith(card.get('code').text())
      }
      await selects[2]!.setValue('Vue')
      expect(wrapper.get('code').text()).toContain('<script setup lang="ts">')
      expect(wrapper.get('code').text()).toContain('layout="stacked" theme="light" animated')
      await selects[2]!.setValue('Markdown')
      expect(wrapper.get('code').text()).toContain('[![Made with Aurora](')
      clipboard.mockRejectedValueOnce(new Error('Clipboard denied'))
      await wrapper.get('button').trigger('click')
      expect(wrapper.get('[role="status"]').text()).toBe('Copy unavailable. Select the snippet and copy it manually.')
    } finally {
      wrapper.unmount()
      clipboard.mockRestore()
    }
  })
})
