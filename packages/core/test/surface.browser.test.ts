import type { AuroraMode } from '@/index'
import type { Backend, LeaseListener } from '@/pool'
import type { SurfaceState } from '@/protocol'
import type { AuroraInput } from '@goatsoft/aurora-format'
import { assertAurora } from '@goatsoft/aurora-format'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GENERATORS } from '@/generators/index'
import { auroraStats, compileCss, configureAurora, hotUpdate, mountAurora } from '@/index'
import { createMainThreadBackend, createWorkerBackend } from '@/pool'
import { setBackends } from '@/surface'
import AuroraWorker from '@/worker?worker'

const hero = assertAurora(Object.values(import.meta.glob<string>('~/presets/classic/hero.aurora', { query: '?raw', import: 'default', eager: true }))[0])
const doc = (extra: Partial<AuroraInput> = {}) => assertAurora({ ...hero, ...extra })

let host: HTMLDivElement
beforeEach(() => {
  host = document.createElement('div')
  host.style.cssText = 'width:320px;height:180px'
  document.body.append(host)
})
afterEach(() => {
  host.remove()
  setBackends(undefined)
  configureAurora({ worker: true, touch: 'webgpu' })
  vi.restoreAllMocks()
})

const until = (check: () => boolean, timeout = 8000) => vi.waitFor(() => {
  expect(check()).toBe(true)
}, { timeout, interval: 20 })
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function stubMedia(matches: Record<string, boolean>) {
  const real = window.matchMedia.bind(window)
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => (query in matches
    ? { matches: matches[query]!, media: query, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList
    : real(query)))
}

/** A backend driven by the test: it records states and lets the test fire frames and failures. */
function scripted(ready = true, attaches = true) {
  const leases: { listener: LeaseListener, states: SurfaceState[], released: boolean }[] = []
  const backend: Backend = {
    acquire(listener) {
      const lease = { listener, states: [] as SurfaceState[], released: false }
      leases.push(lease)
      return {
        ready: Promise.resolve(ready),
        attach: (_, state) => {
          lease.states.push(state)
          return attaches
        },
        update: (state) => lease.states.push(state),
        release: () => {
          lease.released = true
        },
      }
    },
    stats: () => Promise.resolve(undefined),
  }
  return { backend, leases }
}

/** Wraps a real backend so the test sees every frame the renderer reports. */
function observed(backend: Backend, frames: string[]): Backend {
  return {
    acquire: (listener) => backend.acquire({ frame: () => { frames.push('frame'); listener.frame() }, fail: () => { frames.push('fail'); listener.fail() } }),
    stats: () => backend.stats(),
  }
}

describe('mountAurora with the real renderer', () => {
  it.each([['worker', true], ['main thread', false]] as const)('never claims WebGPU before the %s reports a frame', async (_, worker) => {
    configureAurora({ worker })
    const events: string[] = []
    setBackends({
      worker: observed(createWorkerBackend(() => new AuroraWorker(), () => 30, (id) => GENERATORS[id]), events),
      main: observed(createMainThreadBackend(() => navigator.gpu, () => 30, (id) => GENERATORS[id]), events),
    })
    const modes: AuroraMode[] = []
    const surface = mountAurora(host, hero, { onModeChange: (m) => { events.push(`mode ${m}`); modes.push(m) } })
    expect(surface.mode).toBe('css')
    // Settles either way: real GPUs present a frame; headless SwiftShader loses the device on present.
    await until(() => events.length > 0)
    await sleep(500)
    if (modes.includes('webgpu')) expect(events.indexOf('frame')).toBeLessThan(events.indexOf('mode webgpu'))
    else expect(surface.element.dataset['aurora']).toBe('css')
    expect(surface.element.dataset['aurora']).toBe(surface.mode)
    surface.dispose()
  })

  it('reports stats from whichever backend is live', async () => {
    const stats = { surfaces: 1, frames: 42, frameMs: 1.5 }
    setBackends({ worker: { ...scripted().backend, stats: () => Promise.resolve(undefined) }, main: { ...scripted().backend, stats: () => Promise.resolve(stats) } })
    expect(await auroraStats()).toEqual(stats)
  })
})

describe('mountAurora', () => {
  it('pauses at the current phase and resumes without altering speed or resetting CSS drift', async () => {
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: backend })
    let time = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => time)
    const surface = mountAurora(host, hero)
    await until(() => !!leases[0]?.states.length)
    const fallback = surface.element.firstElementChild as HTMLElement
    const animation = fallback.style.animationName
    const origin = leases[0]!.states.at(-1)!.origin
    time = 5000
    surface.pause()
    const frozen = leases[0]!.states.at(-1)!
    expect(surface.paused).toBe(true)
    expect(frozen.pausedAt! - frozen.origin).toBe(4000)
    expect(fallback.style.animationPlayState).toBe('paused')
    time = 25_000
    surface.pause()
    surface.update(doc({ name: 'Paused edit' }))
    expect(leases[0]!.states.at(-1)!.pausedAt).toBe(frozen.pausedAt)
    expect(leases[0]!.states.at(-1)!.doc.motion.speed).toBe(hero.motion.speed)
    surface.resume()
    expect(surface.paused).toBe(false)
    expect(leases[0]!.states.at(-1)!.origin).toBe(origin + 20_000)
    expect(leases[0]!.states.at(-1)!.pausedAt).toBeUndefined()
    expect(fallback.style.animationPlayState).toBe('running')
    expect(fallback.style.animationName).toBe(animation)
    surface.resume()
    expect(leases[0]!.states.at(-1)!.origin).toBe(origin + 20_000)
    surface.dispose()
    surface.pause()
    expect(surface.paused).toBe(false)
  })

  it('starts paused before the first frame', async () => {
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: backend })
    const surface = mountAurora(host, hero, { paused: true })
    await until(() => !!leases[0]?.states.length)
    expect(leases[0]!.states[0]!.pausedAt).toBe(leases[0]!.states[0]!.origin)
    expect(surface.paused).toBe(true)
    surface.dispose()
  })

  it('sends the renderer plain data, even for a Proxy from framework state', async () => {
    // A Vue ref or reactive is a Proxy, which postMessage can't copy: posting one took the worker
    // down for every background on the page.
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: scripted().backend })
    const reactive = new Proxy(hero, {})
    expect(() => structuredClone(reactive)).toThrow()
    const surface = mountAurora(host, reactive)
    await until(() => !!leases[0]?.states.length)
    expect(() => structuredClone(leases[0]!.states[0])).not.toThrow()
    expect(leases[0]!.states[0]!.doc).toEqual(hero)
    surface.update(new Proxy(doc({ name: 'Edited' }), {}))
    expect(() => structuredClone(leases[0]!.states.at(-1))).not.toThrow()
    surface.dispose()
  })

  it('paints CSS at once, then crossfades to WebGPU after the first frame', async () => {
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: scripted().backend })
    const modes: AuroraMode[] = []
    const surface = mountAurora(host, hero, { onModeChange: (m) => modes.push(m) })
    const root = surface.element
    const [fallback, canvas] = root.children as unknown as [HTMLDivElement, HTMLCanvasElement]
    expect(root.getAttribute('aria-hidden')).toBe('true')
    expect(root.dataset['aurora']).toBe('css')
    expect(fallback.style.backgroundImage).toContain('radial-gradient')
    expect(fallback.style.maskImage || fallback.style.getPropertyValue('-webkit-mask-image')).toContain('linear-gradient')
    expect(canvas.style.opacity).toBe('0')
    expect(host.style.position).toBe('relative')

    await until(() => (leases[0]?.states.length ?? 0) > 0)
    const state = leases[0]!.states[0]!
    expect(state).toMatchObject({ width: 160, height: 90, scene: { rect: [0, 0, 1, 1] }, visible: true, reduced: false, output: 'srgb', scroll: 0 })
    expect(surface.mode).toBe('css')
    leases[0]!.listener.frame()
    expect(surface.mode).toBe('webgpu')
    expect(root.dataset['aurora']).toBe('webgpu')
    expect(canvas.style.opacity).toBe('1')
    expect(fallback.style.visibility).toBe('visible')
    await until(() => fallback.style.visibility === 'hidden')
    expect(fallback.style.animation).toBe('')
    expect(modes).toEqual(['webgpu'])

    surface.update(doc({ layers: [{ ...hero.layers[0]!, params: { intensity: 0.9 } }] }))
    expect(leases[0]!.states.at(-1)!.doc.layers[0]!.params['intensity']).toBe(0.9)
    surface.dispose()
    surface.dispose()
    expect(root.isConnected).toBe(false)
    expect(leases[0]!.released).toBe(true)
  })

  it('caps resolution at half the device pixel ratio and 1280 pixels per axis', async () => {
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: backend })
    host.style.cssText = 'width:4000px;height:100px'
    const surface = mountAurora(host, hero)
    await until(() => (leases[0]?.states.length ?? 0) > 0)
    expect(leases[0]!.states[0]).toMatchObject({ width: 1280, height: 32 })
    surface.dispose()
  })

  it('falls back down the ladder, and to CSS on failure', async () => {
    const worker = scripted(false)
    const main = scripted()
    setBackends({ worker: worker.backend, main: main.backend })
    const surface = mountAurora(host, hero)
    await until(() => main.leases.length === 1 && main.leases[0]!.states.length > 0)
    expect(worker.leases[0]!.released).toBe(true)
    main.leases[0]!.listener.frame()
    main.leases[0]!.listener.fail()
    expect(surface.mode).toBe('css')
    expect(surface.element.dataset['aurora']).toBe('css')
    expect((surface.element.lastElementChild as HTMLElement).style.display).toBe('none')
    expect((surface.element.firstElementChild as HTMLElement).style.visibility).toBe('visible')
    surface.dispose()
  })

  it('goes back to WebGPU after falling back to CSS, on a fresh canvas', async () => {
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: backend })
    const surface = mountAurora(host, hero)
    await until(() => (leases[0]?.states.length ?? 0) > 0)
    const first = surface.element.lastElementChild
    leases[0]!.listener.frame()
    leases[0]!.listener.fail()
    expect(surface.mode).toBe('css')
    // A canvas that went to the worker can't be handed over again.
    expect(surface.element.lastElementChild).not.toBe(first)
    surface.update(hero)
    await until(() => (leases[1]?.states.length ?? 0) > 0)
    leases[1]!.listener.frame()
    expect(surface.mode).toBe('webgpu')
    expect((surface.element.lastElementChild as HTMLElement).style.display).toBe('')
    expect((surface.element.lastElementChild as HTMLElement).style.opacity).toBe('1')
    surface.dispose()
  })

  it('paints an imported module\'s precompiled fallback before its generators load, and says why it stays on CSS', async () => {
    setBackends({ worker: scripted().backend, main: scripted().backend })
    const errors: Error[] = []
    const cold = assertAurora({ format: 'aurora', version: 1, name: 'cold', palette: ['#000'], layers: [{ type: 'not-loaded-yet' }] })
    const css = { backgroundImage: 'linear-gradient(red, blue)', backgroundBlendMode: 'normal', drift: 0, style: 'background-image:linear-gradient(red, blue)' }
    const surface = mountAurora(host, { id: 'cold.aurora', doc: cold, css }, { onError: (e) => errors.push(e) })
    const fallback = surface.element.firstElementChild as HTMLElement
    expect(fallback.style.backgroundImage).toContain('linear-gradient')
    await surface.ready
    expect(fallback.style.backgroundImage).toContain('linear-gradient')
    expect(surface.mode).toBe('css')
    expect(errors[0]?.message).toContain('"not-loaded-yet"')
    surface.dispose()
  })

  it('stops following a module\'s hot updates once it shows something else', async () => {
    setBackends({ worker: scripted().backend, main: scripted().backend })
    const module = { id: 'hot-a.aurora', doc: hero, css: compileCss(hero) }
    const surface = mountAurora(host, module)
    const other = doc({ name: 'Other' })
    surface.update(other)
    expect(hotUpdate({ ...module, doc: doc({ name: 'Edited A' }) })).toBe(0)
    surface.dispose()
  })

  it('stays on CSS when no backend can take the canvas', async () => {
    const worker = scripted(true, false)
    const main = scripted(true, false)
    setBackends({ worker: worker.backend, main: main.backend })
    const surface = mountAurora(host, hero)
    await until(() => main.leases[0]?.released === true)
    expect(surface.mode).toBe('css')
    surface.dispose()
  })

  it('disposes when its signal aborts, even before mounting finishes', () => {
    setBackends({ worker: scripted().backend, main: scripted().backend })
    const controller = new AbortController()
    const surface = mountAurora(host, hero, { signal: controller.signal })
    controller.abort()
    expect(surface.element.isConnected).toBe(false)
    const aborted = new AbortController()
    aborted.abort()
    expect(mountAurora(host, hero, { signal: aborted.signal }).element.isConnected).toBe(false)
  })

  it('pins fixed backgrounds to the viewport and drifts the CSS fallback while it shows', async () => {
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: backend })
    const surface = mountAurora(host, doc({ canvas: { fixed: true, parallax: 0.2 } }))
    expect(surface.element.style.position).toBe('fixed')
    const animation = (surface.element.firstElementChild as HTMLElement).style.animation
    expect(animation).toContain('aurora-drift')
    expect(animation).toContain('40s')
    await until(() => (leases[0]?.states.length ?? 0) > 0)
    expect(leases[0]!.states[0]!.scroll).toBe(0)
    surface.dispose()
  })

  it('stays on CSS, still, under reduced motion when the document asks for it', async () => {
    stubMedia({ '(prefers-reduced-motion: reduce)': true })
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: backend })
    const surface = mountAurora(host, doc({ motion: { reduced: 'css' } }))
    await sleep(100)
    expect(leases).toHaveLength(0)
    expect(surface.mode).toBe('css')
    expect((surface.element.firstElementChild as HTMLElement).style.animation).toBe('')
    surface.dispose()
  })

  it('asks for a still frame under reduced motion and swaps without a fade', async () => {
    stubMedia({ '(prefers-reduced-motion: reduce)': true })
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: backend })
    const surface = mountAurora(host, hero)
    await until(() => (leases[0]?.states.length ?? 0) > 0)
    expect(leases[0]!.states[0]!.reduced).toBe('still')
    leases[0]!.listener.frame()
    expect((surface.element.lastElementChild as HTMLElement).style.transition).toBe('none')
    surface.dispose()
    const slow = mountAurora(host, doc({ motion: { reduced: 'slow' } }))
    await until(() => (leases[1]?.states.length ?? 0) > 0)
    expect(leases[1]!.states[0]!.reduced).toBe('slow')
    slow.dispose()
  })

  it('honours the touch opt-out', async () => {
    configureAurora({ touch: 'css' })
    stubMedia({ '(pointer: coarse)': true })
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: backend })
    const surface = mountAurora(host, hero)
    await sleep(100)
    expect(leases).toHaveLength(0)
    surface.dispose()
  })

  it('renders OKLab documents in Display P3 on wide-gamut screens', async () => {
    stubMedia({ '(color-gamut: p3)': true })
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: backend })
    const surface = mountAurora(host, doc({ layers: [{ ...hero.layers[0]!, mix: 'oklab' }] }))
    await until(() => (leases[0]?.states.length ?? 0) > 0)
    expect(leases[0]!.states[0]!.output).toBe('display-p3')
    surface.dispose()
  })

  it('joins scenes so neighbouring panels share one field and clock', async () => {
    const { backend, leases } = scripted()
    setBackends({ worker: backend, main: backend })
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;width:640px'
    const a = document.createElement('div')
    const b = document.createElement('div')
    a.style.cssText = b.style.cssText = 'width:320px;height:180px'
    row.append(a, b)
    document.body.append(row)
    const sa = mountAurora(a, hero, { scene: 'landing' })
    const sb = mountAurora(b, hero, { scene: 'landing' })
    await until(() => leases.length === 2 && leases.every((l) => l.states.length > 0))
    await sleep(50)
    const last = (i: number) => leases[i]!.states.at(-1)!
    expect(last(0).scene).toEqual({ width: 320, height: 90, rect: [0, 0, 0.5, 1] })
    expect(last(1).scene).toEqual({ width: 320, height: 90, rect: [0.5, 0, 0.5, 1] })
    expect(last(0).origin).toBe(last(1).origin)
    sa.dispose()
    sb.dispose()
    row.remove()
  })
})
