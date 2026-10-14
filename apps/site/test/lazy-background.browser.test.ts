import { AuroraBackground } from '@goatsoft/aurora-vue'
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import LazyBackground from '@/components/LazyBackground.vue'
import { modifierCards } from '@/lib/modifiers'

it('paints the compiled fallback without mounting a renderer until it nears the viewport', async () => {
  let notify!: (visible: boolean) => void
  const disconnect = vi.fn()
  const observe = vi.fn()
  const options: (IntersectionObserverInit | undefined)[] = []
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
      options.push(init)
      notify = (visible) => callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }

    observe = observe
    unobserve = vi.fn()
    disconnect = disconnect
  })
  const scene = modifierCards[0]!.scene
  const wrapper = mount(LazyBackground, { props: { src: scene }, global: { stubs: { AuroraBackground: true } }, attachTo: document.body })
  try {
    await wrapper.vm.$nextTick()
    expect(observe).toHaveBeenCalledOnce()
    expect(options[0]?.rootMargin).toBe('300px')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.findComponent(AuroraBackground).exists()).toBe(false)
    expect(wrapper.get('div[style]').attributes('style')).toContain('gradient')
    notify(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(AuroraBackground).exists()).toBe(false)
    notify(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(AuroraBackground).props('src')).toEqual(scene)
    expect(wrapper.find('div[style]').exists()).toBe(false)
    expect(disconnect).toHaveBeenCalled()
    wrapper.getComponent(AuroraBackground).vm.$emit('modeChange', 'webgpu')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('modeChange')).toEqual([['webgpu']])
  } finally {
    wrapper.unmount()
    vi.unstubAllGlobals()
  }
})
