import type { Backend, LeaseListener } from '@goatsoft/aurora'
import { setBackends } from '@goatsoft/aurora'
import { assertAurora } from '@goatsoft/aurora-format'
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, ref } from 'vue'
import { useAurora } from '@/index'

const gate = vi.hoisted(() => {
  let release!: () => void
  const ready = new Promise<void>((resolve) => { release = resolve })
  return { ready, release }
})
vi.mock('~/packages/core/src/interactions', async (original) => {
  await gate.ready
  return original()
})

it('refreshes interaction UI when the controller arrives after the first frame', async () => {
  let attached = false
  let listener: LeaseListener | undefined
  const backend: Backend = {
    acquire(events) {
      listener = events
      return { ready: Promise.resolve(true), attach: () => { attached = true; return true }, update() {}, release() {} }
    },
    stats: () => Promise.resolve(undefined),
  }
  setBackends({ main: backend, worker: backend })
  const doc = assertAurora({ format: 'aurora', version: 1, name: 'Deferred input', palette: ['#123'], layers: [{ type: 'linear-gradient' }], interactions: [{ type: 'follow', bindings: [{ layer: 0, parameter: 'offsetX', input: 'x' }] }] })
  const wrapper = mount(defineComponent({
    setup() {
      const host = ref<HTMLElement>()
      const { surface, mode } = useAurora(host, doc)
      const live = computed(() => mode.value === 'webgpu' && !!surface.value?.interactions)
      return () => h('div', [h('div', { ref: host }), h('span', `${mode.value}: ${live.value ? 'input ready' : 'input loading'}`)])
    },
  }), { attachTo: document.body })
  try {
    await vi.waitFor(() => expect(attached).toBe(true))
    listener!.frame()
    await nextTick()
    expect(wrapper.text()).toBe('webgpu: input loading')
    gate.release()
    await vi.waitFor(() => expect(wrapper.text()).toBe('webgpu: input ready'))
  } finally {
    gate.release()
    wrapper.unmount()
    setBackends(undefined)
  }
})
