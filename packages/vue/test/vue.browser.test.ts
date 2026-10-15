import type { Backend, LeaseListener, SurfaceState } from '@goatsoft/aurora'
import { compileCss, setBackends } from '@goatsoft/aurora'
import { assertAurora } from '@goatsoft/aurora-format'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { AuroraBackground, AuroraScene, useAurora } from '@/index'

const hero = assertAurora(Object.values(import.meta.glob<string>('~/presets/classic/hero.aurora', { query: '?raw', import: 'default', eager: true }))[0])
const tile = assertAurora(Object.values(import.meta.glob<string>('~/presets/classic/stack-tile.aurora', { query: '?raw', import: 'default', eager: true }))[0])
const heroModule = { id: 'presets/classic/hero.aurora', doc: hero, css: compileCss(hero) }

const leases: { listener: LeaseListener, states: SurfaceState[], released: boolean }[] = []
const backend: Backend = {
  acquire(listener) {
    const lease = { listener, states: [] as SurfaceState[], released: false }
    leases.push(lease)
    return {
      ready: Promise.resolve(true),
      attach: (_, s) => lease.states.push(s) > 0,
      update: (s) => lease.states.push(s),
      release: () => { lease.released = true },
    }
  },
  stats: () => Promise.resolve(undefined),
}

let parent: HTMLDivElement
beforeEach(() => {
  leases.length = 0
  setBackends({ worker: backend, main: backend })
  parent = document.createElement('div')
  parent.style.cssText = 'position:relative;width:320px;height:180px'
  document.body.append(parent)
})
afterEach(() => {
  parent.remove()
  setBackends(undefined)
  vi.restoreAllMocks()
})
const until = (check: () => boolean) => vi.waitFor(() => { expect(check()).toBe(true) }, { timeout: 5000, interval: 10 })

describe('<AuroraBackground>', () => {
  it('updates reactive playback in place while preserving the authored document', async () => {
    const paused = ref(true)
    const wrapper = mount(defineComponent({ setup: () => () => h(AuroraBackground, { src: heroModule, paused: paused.value }) }), { attachTo: parent })
    await until(() => !!leases[0]?.states.length)
    expect(leases[0]!.states[0]!.pausedAt).toBeDefined()
    paused.value = false
    await nextTick()
    expect(leases[0]!.states.at(-1)!.pausedAt).toBeUndefined()
    paused.value = true
    await nextTick()
    expect(leases[0]!.states.at(-1)!.pausedAt).toBeDefined()
    expect(leases[0]!.states.at(-1)!.doc).toEqual(hero)
    expect(leases).toHaveLength(1)
    wrapper.unmount()
  })

  it('mounts, emits mode changes, passes mode to the slot and updates in place', async () => {
    const src = ref<typeof heroModule | typeof tile>(heroModule)
    const wrapper = mount(defineComponent({
      setup: () => () => h(AuroraBackground, { src: src.value, onModeChange: (m: string) => modes.push(m) }, { default: ({ mode }: { mode: string }) => [h('i', mode)] }),
    }), { attachTo: parent })
    const modes: string[] = []
    await until(() => leases.length === 1 && leases[0]!.states.length > 0)
    expect(wrapper.find('[data-aurora]').exists()).toBe(true)
    expect(wrapper.find('[data-aurora-ssr]').exists()).toBe(false)
    expect(wrapper.find('i').text()).toBe('css')
    leases[0]!.listener.frame()
    await nextTick()
    expect(modes).toEqual(['webgpu'])
    expect(wrapper.find('i').text()).toBe('webgpu')

    src.value = tile
    await nextTick()
    expect(leases).toHaveLength(1)
    expect(leases[0]!.states.at(-1)!.doc.name).toBe('Classic stack tile')
    wrapper.unmount()
    expect(leases[0]!.released).toBe(true)
  })

  it('loads URLs and reports load errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const errors: Error[] = []
    const src = ref('/presets/classic/hero.aurora')
    const wrapper = mount(defineComponent({ setup: () => () => h(AuroraBackground, { src: src.value, onError: (e: Error) => errors.push(e) }) }), { attachTo: parent })
    await until(() => leases.length === 1)
    expect(leases[0]!.states[0]!.doc.name).toBe('Classic hero')
    src.value = '/missing.aurora'
    await until(() => errors.length === 1)
    expect(errors[0]!.message).toMatch(/Could not load .*\/missing\.aurora: 404/)
    wrapper.unmount()
  })

  it('shares one field across an <AuroraScene>', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', { style: 'display:flex;width:640px' }, h(AuroraScene, { name: 'landing' }, () => [
        h('div', { style: 'position:relative;width:320px;height:180px' }, h(AuroraBackground, { src: heroModule })),
        h('div', { style: 'position:relative;width:320px;height:180px' }, h(AuroraBackground, { src: heroModule })),
      ])),
    }), { attachTo: parent })
    await until(() => leases.length === 2 && leases.every((l) => l.states.length > 0))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(leases.map((l) => l.states.at(-1)!.scene.rect)).toEqual([[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]])
    wrapper.unmount()
  })

  it('hydrates server HTML without a mismatch and never shows zero or two fallbacks', async () => {
    const App = { render: () => h(AuroraBackground, { src: heroModule }) }
    parent.innerHTML = await renderToString(createSSRApp(App))
    expect(parent.querySelectorAll('[data-aurora-ssr] > div')).toHaveLength(1)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createSSRApp(App)
    app.mount(parent)
    // Straight after mount: mountAurora's fallback is already painted.
    expect(parent.querySelectorAll('[data-aurora]')).toHaveLength(1)
    await nextTick()
    // Before the next paint, the server fallback is gone: exactly one fallback remains.
    expect(parent.querySelector('[data-aurora-ssr]')).toBeNull()
    expect(parent.querySelector('.aurora-background > div:not([data-aurora])')).toBeNull()
    expect(warn.mock.calls.filter(([m]) => String(m).includes('Hydration'))).toEqual([])
    app.unmount()
  })
})

describe('useAurora', () => {
  it('remounts when the scene changes and exposes the surface', async () => {
    const scene = ref('a')
    let api: ReturnType<typeof useAurora> | undefined
    const wrapper = mount(defineComponent({
      setup() {
        const el = ref<HTMLElement>()
        api = useAurora(el, hero, { scene })
        return () => h('div', { ref: el, style: 'position:absolute;inset:0' })
      },
    }), { attachTo: parent })
    await until(() => leases.length === 1)
    expect(api!.surface.value).toBeDefined()
    scene.value = 'b'
    await until(() => leases.length === 2)
    expect(leases[0]!.released).toBe(true)
    wrapper.unmount()
  })

  it('logs load errors when there is no handler', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(defineComponent({
      setup() {
        const el = ref<HTMLElement>()
        useAurora(el, '/missing.aurora')
        return () => h('div', { ref: el })
      },
    }), { attachTo: parent })
    await until(() => error.mock.calls.length === 1)
    expect(String(error.mock.calls[0]![0])).toMatch(/^useAurora: Could not load/)
    wrapper.unmount()
  })
})
