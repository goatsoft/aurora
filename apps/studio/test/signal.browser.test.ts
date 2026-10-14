import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ModifiersPanel from '@/components/ModifiersPanel.vue'
import { starter } from '@/editor/document'
import { useStudio } from '@/editor/studio'

const studio = useStudio()

describe('Signal distortion controls', () => {
  it('enables, edits, resets and removes the effect with undo support', async () => {
    studio.open(starter(), 'file')
    const wrapper = mount(ModifiersPanel, { attachTo: document.body })
    try {
      await wrapper.get('[role="switch"][aria-label="Signal distortion"]').trigger('click')
      expect(studio.doc.value.modifiers?.signal).toEqual({})
      const amount = wrapper.get('[role="slider"][aria-label="Amount"]')
      await amount.trigger('keydown', { key: 'ArrowRight' })
      expect(studio.doc.value.modifiers?.signal?.amount).toBe(0.36)
      await amount.trigger('dblclick')
      expect(studio.doc.value.modifiers?.signal).toEqual({})
      await wrapper.get('[role="switch"][aria-label="Signal distortion"]').trigger('click')
      expect(studio.doc.value.modifiers).toBeUndefined()
      studio.undo()
      await wrapper.vm.$nextTick()
      expect(wrapper.get('[role="switch"][aria-label="Signal distortion"]').attributes('aria-checked')).toBe('true')
      expect(wrapper.findAll('[role="slider"]')).toHaveLength(7)
      await wrapper.get('[role="switch"][aria-label="Pixelate"]').trigger('click')
      await wrapper.get('[role="switch"][aria-label="Vignette"]').trigger('click')
      await wrapper.get('[role="slider"][aria-label="Block size"]').trigger('keydown', { key: 'ArrowRight' })
      await wrapper.get('[role="slider"][aria-label="Darkness"]').trigger('keydown', { key: 'ArrowRight' })
      expect(studio.doc.value.modifiers?.pixelate?.size).toBe(9)
      expect(studio.doc.value.modifiers?.vignette?.amount).toBe(0.46)
      expect(wrapper.findAll('[role="slider"]')).toHaveLength(11)
      await wrapper.get('[role="switch"][aria-label="Signal distortion"]').trigger('click')
      expect(studio.doc.value.modifiers).toEqual({ pixelate: { size: 9 }, vignette: { amount: 0.46 } })
    } finally {
      wrapper.unmount()
    }
  })
})
