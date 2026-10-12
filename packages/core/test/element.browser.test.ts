import type { AuroraErrorEvent, AuroraModeEvent } from '@/element'
import type { Backend, LeaseListener } from '@/pool'
import type { SurfaceState } from '@/protocol'
import { assertAurora } from '@goatsoft/aurora-format'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compileCss } from '@/css'
import { AuroraBackgroundElement, loadAurora } from '@/element'
import { hotUpdate } from '@/module'
import { setBackends } from '@/surface'
import '@/element'

const HERO = '/presets/goat/hero.aurora'
const leases: { listener: LeaseListener, states: SurfaceState[] }[] = []
const backend: Backend = {
  acquire(listener) {
    const lease = { listener, states: [] as SurfaceState[] }
    leases.push(lease)
    return { ready: Promise.resolve(true), attach: (_, s) => lease.states.push(s) > 0, update: (s) => lease.states.push(s), release() {} }
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

const until = (check: () => boolean) => vi.waitFor(() => {
  expect(check()).toBe(true)
}, { timeout: 5000, interval: 10 })

function element(html: string): AuroraBackgroundElement {
  parent.innerHTML = html
  return parent.firstElementChild as AuroraBackgroundElement
}

describe('<aurora-bg>', () => {
  it('is defined, fills its parent and is hidden from assistive tech', () => {
    const el = element('<aurora-bg></aurora-bg>')
    expect(el).toBeInstanceOf(AuroraBackgroundElement)
    const style = getComputedStyle(el)
    expect([style.display, style.position, style.pointerEvents]).toEqual(['block', 'absolute', 'none'])
    expect(el.getBoundingClientRect().width).toBe(320)
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.matches(':state(css)')).toBe(true)
    expect(el.mode).toBe('css')
  })

  it('loads src, paints the fallback, and exposes the mode as a CSS state and an event', async () => {
    const el = element(`<aurora-bg src="${HERO}"></aurora-bg>`)
    const modes: string[] = []
    el.addEventListener('aurora-mode', (e: AuroraModeEvent) => modes.push(e.detail.mode))
    await until(() => leases.length === 1 && leases[0]!.states.length > 0)
    expect(el.querySelector('[data-aurora]')).not.toBeNull()
    expect(leases[0]!.states[0]!.doc.name).toBe('GOAT hero')
    leases[0]!.listener.frame()
    expect(el.mode).toBe('webgpu')
    expect(el.matches(':state(webgpu)')).toBe(true)
    expect(el.matches(':state(css)')).toBe(false)
    expect(modes).toEqual(['webgpu'])
  })

  it('reports invalid files with every issue, against the URL', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const el = element('<aurora-bg></aurora-bg>')
    const errors: Error[] = []
    el.addEventListener('aurora-error', (e: AuroraErrorEvent) => errors.push(e.detail.error))
    el.src = '/packages/core/test/fixtures/broken.aurora'
    await until(() => errors.length === 1)
    expect(errors[0]!.message).toBe(`Invalid .aurora document in ${location.origin}/packages/core/test/fixtures/broken.aurora:\n  $.layers[0].blnd is not a known key. Did you mean "blend"?`)
    expect(console.error).toHaveBeenCalledWith(`<aurora-bg> ${errors[0]!.message}`)
    expect(el.querySelector('[data-aurora]')).toBeNull()
  })

  it('checks generators too, and reports missing files', async () => {
    await expect(loadAurora('/packages/core/test/fixtures/unknown-generator.aurora')).rejects.toThrow('$.layers[0].type is not a known generator. Did you mean "aurora-fbm"?')
    await expect(loadAurora('/nope.aurora')).rejects.toThrow(/^Could not load \/nope\.aurora: 404/)
  })

  it('takes a document or module through `source`, and hot-updates modules in place', async () => {
    const doc = await loadAurora(HERO)
    const el = element('<aurora-bg></aurora-bg>')
    el.source = doc
    expect(el.source).toBe(doc)
    await until(() => leases.length === 1 && leases[0]!.states.length > 0)
    const module = { id: '/hero.aurora', doc, css: compileCss(doc) }
    el.source = module
    const edited = assertAurora({ ...doc, name: 'Edited' })
    expect(hotUpdate({ ...module, doc: edited })).toBe(1)
    expect(leases[0]!.states.at(-1)!.doc.name).toBe('Edited')
    expect(leases).toHaveLength(1)
    el.source = undefined
    expect(el.querySelector('[data-aurora]')).toBeNull()
    expect(hotUpdate(module)).toBe(0)
  })

  it('remounts on scene changes, cleans up on disconnect and comes back on reconnect', async () => {
    const doc = await loadAurora(HERO)
    const el = element('<aurora-bg scene="a"></aurora-bg>')
    el.source = doc
    await until(() => leases.length === 1)
    el.scene = 'b'
    await until(() => leases.length === 2)
    expect(el.scene).toBe('b')
    el.remove()
    expect(el.querySelector('[data-aurora]')).toBeNull()
    parent.append(el)
    await until(() => leases.length === 3)
    expect(el.querySelectorAll('[data-aurora]')).toHaveLength(1)
  })

  it('pins fixed backgrounds to the viewport', async () => {
    const el = element('<aurora-bg></aurora-bg>')
    el.source = assertAurora({ ...(await loadAurora(HERO)), canvas: { fixed: true } })
    expect(el.style.position).toBe('fixed')
  })

  it('ignores a stale load when src changes again', async () => {
    const el = element(`<aurora-bg src="${HERO}"></aurora-bg>`)
    el.src = '/presets/goat/stack-tile.aurora'
    await until(() => (leases[0]?.states.length ?? 0) > 0)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(leases.map((l) => l.states[0]!.doc.name)).toEqual(['GOAT stack tile'])
  })
})
