import { ScrubField } from '@goatsoft/aurora-editor-ui'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

function field(value = 0.5) {
  return mount(ScrubField, {
    attachTo: document.body,
    props: { 'label': 'Speed', 'min': 0, 'max': 1, 'step': 0.01, 'default': 0.06, 'modelValue': value, 'onUpdate:modelValue': (v: number) => wrapper.setProps({ modelValue: v }) },
  })
}
let wrapper: ReturnType<typeof field>

describe('ScrubField', () => {
  it('nudges with arrow keys by one step, or ten with shift, clamped to its range', async () => {
    wrapper = field(0.5)
    const slider = wrapper.get('[role="slider"]')
    await slider.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.props('modelValue')).toBe(0.51)
    await slider.trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    expect(wrapper.props('modelValue')).toBe(0.41)
    for (let i = 0; i < 10; i++) await slider.trigger('keydown', { key: 'ArrowUp', shiftKey: true })
    expect(wrapper.props('modelValue')).toBe(1)
    expect(slider.attributes('aria-valuenow')).toBe('1')
    wrapper.unmount()
  })

  it('scrubs with a drag, about the whole range per 240 px', async () => {
    wrapper = field(0.2)
    const el = wrapper.get('[role="slider"]').element as HTMLElement
    const at = (type: string, x: number) => el.dispatchEvent(new PointerEvent(type, { clientX: x, button: 0, pointerId: 1, bubbles: true }))
    el.setPointerCapture = () => undefined
    el.hasPointerCapture = () => true
    el.releasePointerCapture = () => undefined
    at('pointerdown', 100)
    at('pointermove', 160)
    await wrapper.vm.$nextTick()
    expect(wrapper.props('modelValue')).toBe(0.45)
    at('pointerup', 160)
    expect(wrapper.emitted('end')).toHaveLength(1)
    wrapper.unmount()
  })

  it('types a value on click, and resets on double-click', async () => {
    wrapper = field(0.5)
    const slider = wrapper.get('[role="slider"]')
    const el = slider.element as HTMLElement
    el.setPointerCapture = () => undefined
    el.releasePointerCapture = () => undefined
    el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, button: 0, pointerId: 1 }))
    el.dispatchEvent(new PointerEvent('pointerup', { clientX: 10, pointerId: 1 }))
    await wrapper.vm.$nextTick()
    const input = wrapper.get('input')
    await input.setValue('2')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.props('modelValue')).toBe(1)
    await slider.trigger('dblclick')
    expect(wrapper.emitted('reset')).toHaveLength(1)
    wrapper.unmount()
  })

  it('dims values the document doesn\'t set', () => {
    wrapper = field(0.06)
    expect(wrapper.get('span.font-mono').classes()).toContain('text-foreground/80')
    wrapper.unmount()
  })
})
