import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { SetupContext } from 'vue'
import ColorPicker from '@/components/ColorPicker.vue'

function picker(css: string) {
  const wrapper = mount(ColorPicker, {
    attachTo: document.body,
    // Tooltips need the app's TooltipProvider; their contents are what's under test.
    global: { stubs: { Tip: { setup: (_: unknown, { slots }: SetupContext) => () => slots['default']?.() } } },
    props: { 'page': 'dark' as const, 'modelValue': css, 'onUpdate:modelValue': (v: string) => wrapper.setProps({ modelValue: v }) },
  })
  return wrapper
}

describe('ColorPicker', () => {
  it('keeps typed colours exactly as written, so GOAT parity colours survive', async () => {
    const wrapper = picker('oklch(0.7 0.15 250)')
    const input = wrapper.get('input[aria-label="CSS colour"]')
    await input.setValue('color(srgb 0.23 0.63 1)')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.props('modelValue')).toBe('color(srgb 0.23 0.63 1)')
    wrapper.unmount()
  })

  it('explains colours it can\'t read, and leaves the value alone', async () => {
    const wrapper = picker('oklch(0.7 0.15 250)')
    const input = wrapper.get('input[aria-label="CSS colour"]')
    await input.setValue('red')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.text()).toContain('"red" is not a colour. Use oklch')
    expect(wrapper.props('modelValue')).toBe('oklch(0.7 0.15 250)')
    wrapper.unmount()
  })

  it('writes canonical oklch() when nudged, and flags colours outside sRGB', async () => {
    const wrapper = picker('oklch(0.7 0.15 250)')
    expect(wrapper.text()).toContain('sRGB')
    await wrapper.get('[aria-label="Chroma"]').trigger('keydown', { key: 'ArrowUp', shiftKey: true })
    expect(wrapper.props('modelValue')).toBe('oklch(0.7 0.16 250)')
    await wrapper.setProps({ modelValue: 'oklch(0.6 0.3 30)' })
    expect(wrapper.text()).toContain('Out of P3')
    wrapper.unmount()
  })

  it('offers harmonies to add to the palette', async () => {
    const wrapper = picker('oklch(0.7 0.15 250)')
    await wrapper.get('[aria-label="Add Complement"]').trigger('click')
    expect(wrapper.emitted('add')?.[0]).toEqual(['oklch(0.7 0.15 70)'])
    wrapper.unmount()
  })
})
