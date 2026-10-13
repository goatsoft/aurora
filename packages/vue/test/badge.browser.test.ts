import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { AuroraBadge } from '@/badge'

describe('<AuroraBadge> updates', () => {
  it('updates the image and accessible name when the app theme or label changes', async () => {
    const wrapper = mount(AuroraBadge, { props: { baseUrl: '/assets/brand/badges/v1' } })
    try {
      expect(wrapper.get('img').attributes('src')).toBe('/assets/brand/badges/v1/made-with-inline-auto.svg')
      await wrapper.setProps({ theme: 'dark', animated: true, label: 'powered-by' })
      expect(wrapper.get('img').attributes('src')).toBe('/assets/brand/badges/v1/powered-by-inline-dark-animated.svg')
      expect(wrapper.get('img').attributes('alt')).toBe('Powered by Aurora')
      expect(wrapper.attributes('href')).toBe('https://aurora.goatsoft.io/')
      await wrapper.setProps({ animated: false, layout: 'stacked' })
      expect(wrapper.get('img').attributes('src')).toBe('/assets/brand/badges/v1/powered-by-dark.svg')
      expect(wrapper.get('img').attributes('width')).toBe('168')
      expect(wrapper.get('img').attributes('height')).toBe('48')
    } finally {
      wrapper.unmount()
    }
  })
})
