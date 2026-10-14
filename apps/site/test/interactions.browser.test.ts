import type { Backend, LeaseListener, SurfaceState } from '@goatsoft/aurora'
import { configureAurora, setBackends } from '@goatsoft/aurora'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InteractionPlayground from '@/components/InteractionPlayground.vue'
import InteractionsSection from '@/components/section/InteractionsSection.vue'
import { interactionCards } from '@/lib/interactions'
import '@/main.css'

const leases: { listener: LeaseListener, states: SurfaceState[], released: boolean }[] = []
const backend: Backend = {
  acquire(listener) {
    const lease = { listener, states: [] as SurfaceState[], released: false }
    leases.push(lease)
    return { ready: Promise.resolve(true), attach: (_, state) => lease.states.push(state) > 0, update: (state) => { lease.states.push(state) }, release: () => { lease.released = true } }
  },
  stats: () => Promise.resolve(undefined),
}
beforeEach(() => {
  leases.length = 0
  configureAurora({ worker: false })
  setBackends({ main: backend, worker: backend })
})
afterEach(() => {
  setBackends(undefined)
  configureAurora({ worker: true })
})
const until = (check: () => boolean) => vi.waitFor(() => expect(check()).toBe(true), { timeout: 8000 })

describe('gallery interaction playgrounds', () => {
  it('shows all five compositions with their modules and documentation link', () => {
    const wrapper = mount(InteractionsSection, { global: { stubs: { InteractionPlayground: true, RouterLink: RouterLinkStub } } })
    try {
      expect(wrapper.get('h2').text()).toBe('Interactions')
      expect(wrapper.findAllComponents(InteractionPlayground).map((card) => card.props('scene'))).toEqual(interactionCards.map((card) => card.scene))
      expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/docs/guide/interactions')
      expect(interactionCards.map((card) => card.scene.doc.name)).toEqual(['Aurora Follow', 'Depth Landscape', 'Tap to Ping', 'Grab the Signal', 'Signal Response'])
    } finally {
      wrapper.unmount()
    }
  })

  it('pauses ambient animation and emits keyboard pulses without editing the shared preset', async () => {
    const card = interactionCards.find((item) => item.id === 'tap-to-ping')!
    const before = JSON.stringify(card.scene.doc)
    const wrapper = mount(InteractionPlayground, { props: { scene: card.scene, body: card.body, kind: 'impulse' }, attachTo: document.body, global: { stubs: { EditInStudio: true } } })
    try {
      await until(() => !!leases[0]?.states.length)
      expect(wrapper.text()).toContain('CSS fallback')
      expect(wrapper.findAll('button').find((button) => button.text() === 'Emit pulse')!.attributes('disabled')).toBeDefined()
      leases[0]!.listener.frame()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Tap to respond')
      await wrapper.get('[aria-label="Pause Tap to Ping"]').trigger('click')
      await until(() => leases[0]!.states.at(-1)!.pausedAt !== undefined)
      const phase = leases[0]!.states.at(-1)!.pausedAt
      const target = wrapper.get('[aria-label="Tap to Ping interaction playground"]')
      expect(target.attributes('aria-hidden')).toBeUndefined()
      expect(wrapper.get('[aria-hidden="true"]').attributes('tabindex')).toBeUndefined()
      await target.trigger('keydown', { key: 'ArrowRight' })
      await target.trigger('keydown', { key: 'Enter' })
      await until(() => leases[0]!.states.at(-1)!.doc.layers[1]!.opacity > 0)
      expect(leases[0]!.states.at(-1)!.doc.layers[1]!.params['x']).toBeCloseTo(0.58)
      expect(leases[0]!.states.at(-1)!.pausedAt).toBe(phase)
      expect(JSON.stringify(card.scene.doc)).toBe(before)
      await target.trigger('keydown', { key: 'Escape' })
      await until(() => leases[0]!.states.at(-1)!.doc.layers[1]!.opacity === 0)
    } finally {
      wrapper.unmount()
    }
    expect(leases[0]!.released).toBe(true)
  })

  it('opts into dragging without remounting, supports grab/pull/release buttons and restores scrolling', async () => {
    const card = interactionCards.find((item) => item.id === 'grab-the-signal')!
    const wrapper = mount(InteractionPlayground, { props: { scene: card.scene, body: card.body, kind: 'grab' }, attachTo: document.body, global: { stubs: { EditInStudio: true } } })
    try {
      await until(() => !!leases[0]?.states.length)
      leases[0]!.listener.frame()
      await wrapper.vm.$nextTick()
      const target = wrapper.get('[aria-label="Grab the Signal interaction playground"]')
      expect(getComputedStyle(target.element).touchAction).not.toBe('none')
      await wrapper.get('input[type="checkbox"]').setValue(true)
      await until(() => getComputedStyle(target.element).touchAction === 'none')
      expect(leases).toHaveLength(1)
      const button = (text: string) => wrapper.findAll('button').find((element) => element.text() === text)!
      await button('Grab').trigger('click')
      await button('Pull right').trigger('click')
      await until(() => (leases[0]!.states.at(-1)!.transforms?.[0]?.[0] ?? 0) > 0)
      await button('Release').trigger('click')
      await until(() => Math.abs(leases[0]!.states.at(-1)!.transforms?.[0]?.[0] ?? 1) < 0.001)
      await wrapper.get('input[type="checkbox"]').setValue(false)
      await until(() => getComputedStyle(target.element).touchAction !== 'none')
      expect(leases).toHaveLength(1)
    } finally {
      wrapper.unmount()
    }
  })
})
