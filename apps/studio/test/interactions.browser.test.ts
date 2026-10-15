import { loadGenerators } from '@goatsoft/aurora'
import { INTERACTION_BINDING_CONTROLS, INTERACTION_CONTROLS, INTERACTIONS } from '@goatsoft/aurora-format'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import InteractionsPanel from '@/components/InteractionsPanel.vue'
import Stage from '@/components/Stage.vue'
import { starter } from '@/editor/document'
import { useStudio } from '@/editor/studio'

await loadGenerators()
const studio = useStudio()

describe('Studio interaction controls', () => {
  it.each(Object.keys(INTERACTIONS) as (keyof typeof INTERACTIONS)[])('uses shared controls, defaults and bounds for %s', (type) => {
    studio.open({ ...starter(), interactions: [{ type, bindings: [{ layer: 0, parameter: 'offsetX', input: 'x' }] }] })
    const wrapper = mount(InteractionsPanel, { attachTo: document.body })
    try {
      for (const key of INTERACTIONS[type].controls) {
        const control = INTERACTION_CONTROLS[key]
        const slider = wrapper.get(`[role="slider"][aria-label="${control.label}"]`)
        expect(slider.attributes('aria-valuemin')).toBe(String(control.min))
        expect(slider.attributes('aria-valuemax')).toBe(String(control.max))
        expect(slider.attributes('aria-valuenow')).toBe(String(control.default))
      }
      const amount = wrapper.get('[role="slider"][aria-label="Response amount"]')
      expect(amount.attributes('aria-valuemin')).toBe(String(INTERACTION_BINDING_CONTROLS.amount.min))
      expect(amount.attributes('aria-valuemax')).toBe(String(INTERACTION_BINDING_CONTROLS.amount.max))
      if (type === 'impulse') expect(wrapper.get('[role="slider"][aria-label="Pulse slot"]').attributes('aria-valuemax')).toBe(String(INTERACTION_BINDING_CONTROLS.slot.max))
      else expect(wrapper.find('[role="slider"][aria-label="Pulse slot"]').exists()).toBe(false)
    } finally { wrapper.unmount() }
  })

  it('adds, edits and removes modules with history, and adds Ping in the same undo step', async () => {
    studio.open(starter())
    const wrapper = mount(InteractionsPanel, { attachTo: document.body })
    try {
      await wrapper.findAll('button').find((button) => button.text() === 'Follow')!.trigger('click')
      expect(studio.doc.value.interactions![0]!.type).toBe('follow')
      const strength = wrapper.get('[role="slider"][aria-label="Strength"]')
      await strength.trigger('keydown', { key: 'ArrowRight' })
      expect(studio.doc.value.interactions![0]!.strength).toBe(1.01)
      await strength.trigger('dblclick')
      expect(studio.doc.value.interactions![0]!.strength).toBeUndefined()
      await strength.trigger('keydown', { key: 'ArrowRight' })
      const amount = wrapper.findAll('[role="slider"][aria-label="Response amount"]')[0]!
      await amount.trigger('keydown', { key: 'ArrowRight' })
      expect(studio.doc.value.interactions![0]!.bindings[0]).toEqual({ layer: 0, parameter: 'offsetX', input: 'x', amount: 0.13 })
      const saved = studio.file.value
      await wrapper.get('[role="switch"][aria-label="Enable pointer drag"]').trigger('click')
      expect(studio.ui.dragInteractions).toBe(true)
      expect(studio.file.value).toBe(saved)
      const [id] = studio.layerIds.value
      await wrapper.findAll('button').find((button) => button.text() === 'Impulse')!.trigger('click')
      expect(studio.doc.value.layers[1]).toMatchObject({ type: 'ping', opacity: 0, params: { background: 0 } })
      expect(studio.layerIds.value[0]).toBe(id)
      expect(studio.issues.value).toEqual([])
      studio.undo()
      await wrapper.vm.$nextTick()
      expect(studio.doc.value.layers).toHaveLength(1)
      expect(studio.doc.value.interactions).toHaveLength(1)
      await wrapper.get('[aria-label="Remove Follow interaction"]').trigger('click')
      expect(studio.doc.value.interactions).toBeUndefined()
      studio.undo()
      await wrapper.vm.$nextTick()
      expect(wrapper.get('[role="slider"][aria-label="Strength"]').attributes('aria-valuenow')).toBe('1.01')
    } finally {
      wrapper.unmount()
      studio.ui.dragInteractions = false
    }
  })

  it('offers keyboard input outside the decorative background without changing saved configuration', async () => {
    studio.open({ ...starter(), interactions: [{ type: 'follow', bindings: [{ layer: 0, parameter: 'offsetX', input: 'x' }] }] })
    const input = { move: vi.fn(), activate: vi.fn(), grab: vi.fn(), release: vi.fn(), reset: vi.fn(), leave: vi.fn() }
    const Background = defineComponent({
      name: 'AuroraBackground',
      setup(_, { expose }) {
        expose({ surface: { interactions: input } })
        return () => h('div', { 'aria-hidden': 'true' })
      },
    })
    const wrapper = mount(Stage, { attachTo: document.body, global: { stubs: { AuroraBackground: Background, EditableText: true } } })
    try {
      const file = studio.file.value
      const playground = wrapper.get('[aria-label="Scene interaction playground"]')
      expect(playground.attributes('tabindex')).toBe('0')
      expect(playground.attributes('aria-hidden')).toBeUndefined()
      await playground.trigger('keydown', { key: 'g' })
      expect(input.grab).toHaveBeenCalledWith(0.5, 0.5)
      await playground.trigger('keydown', { key: 'ArrowRight' })
      expect(input.move).toHaveBeenCalledWith(0.58, 0.5)
      await playground.trigger('keydown', { key: 'Enter' })
      expect(input.activate).toHaveBeenCalledWith(0.58, 0.5)
      await playground.trigger('keydown', { key: 'g' })
      expect(input.release).toHaveBeenCalledOnce()
      await playground.trigger('keydown', { key: 'Escape' })
      expect(input.reset).toHaveBeenCalledOnce()
      expect(studio.file.value).toBe(file)
      expect(wrapper.get('#stage-interaction-help').text()).toContain('Cursor 50%, 50%. Released.')
    } finally {
      wrapper.unmount()
    }
  })
})
