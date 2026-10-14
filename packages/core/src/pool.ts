import type { Generator } from './generators/define'
import type { RendererStats, SurfaceState, WorkerRequest, WorkerResponse } from './protocol'
import type { Renderer } from './renderer'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import type { RgbSpace } from '@goatsoft/color'
import { generatorSpec } from './generators/define'

export interface LeaseListener {
  /** The surface rendered its first frame. */
  frame: () => void
  /** The backend failed: show CSS. */
  fail: () => void
}

/** One surface's handle on a rendering backend (the shared worker or the main-thread renderer). */
export interface Lease {
  /** Resolves true when the backend can render. False means use another backend or CSS. */
  ready: Promise<boolean>
  /** Hands the canvas over. False if it can't be (the canvas is then still usable elsewhere). */
  attach: (canvas: HTMLCanvasElement, state: SurfaceState) => boolean
  update: (state: SurfaceState) => void
  release: () => void
}

export interface Backend {
  acquire: (listener: LeaseListener) => Lease
  /**
   * Starts the backend (its GPU device) if it isn't running and, given a document, compiles its
   * pipeline ahead of any surface. The document's generators must be loaded. Unused, the backend
   * stops after `IDLE_RELEASE_MS`. Resolves like a lease's `ready`. Optional for custom backends.
   */
  prepare?: (doc?: AuroraDocument, output?: RgbSpace) => Promise<boolean>
  stats: () => Promise<RendererStats | undefined>
}

/** How long a backend stays up with no surfaces: after the last one goes, or after `prepare` alone. */
export const IDLE_RELEASE_MS = 10_000

/** How long the worker gets to prove it can render (ADR-0077). */
export const PROBE_TIMEOUT = 4000

/** A lease on a backend that can't render here: the surface moves on to the next one. */
const UNAVAILABLE: Lease = { ready: Promise.resolve(false), attach: () => false, update: () => undefined, release: () => undefined }

/**
 * The page's worker backend (ADR-0079): one worker, one lease per surface. The worker starts on the
 * first lease and terminates with the last, and any failure moves every surface to CSS. A failed
 * probe isn't retried: this browser can't render in a worker, so later surfaces go straight to
 * the main thread rather than waiting on another probe.
 */
export function createWorkerBackend(factory: () => Worker, fps: () => number, generators: (id: string) => Generator | undefined): Backend {
  let host: ReturnType<typeof start> | undefined
  let nextId = 0
  let idle: ReturnType<typeof setTimeout> | undefined
  let unavailable = false

  function start() {
    const worker = factory()
    const listeners = new Map<number, LeaseListener>()
    const stats: ((stats: RendererStats) => void)[] = []
    const registered = new Set<string>()
    let failed = false
    let resolveReady!: (ready: boolean) => void
    const ready = new Promise<boolean>((resolve) => {
      resolveReady = resolve
    })
    const timeout = setTimeout(() => {
      unavailable = true
      fail()
    }, PROBE_TIMEOUT)

    function fail() {
      if (failed) return
      failed = true
      clearTimeout(timeout)
      resolveReady(false)
      worker.terminate()
      for (const listener of listeners.values()) listener.fail()
      for (const resolve of stats.splice(0)) resolve({ surfaces: 0, frames: 0, frameMs: 0 })
    }

    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (failed) return
      if (data.type === 'ready') {
        clearTimeout(timeout)
        if (data.available) resolveReady(true)
        else {
          unavailable = true
          fail()
        }
      } else if (data.type === 'frame') listeners.get(data.id)?.frame()
      else if (data.type === 'stats') stats.shift()?.(data.stats)
      else fail()
    }
    worker.onerror = fail
    worker.onmessageerror = fail

    function send(message: WorkerRequest, transfer: Transferable[] = []): boolean {
      if (failed) return false
      try {
        worker.postMessage(message, transfer)
        return true
      } catch {
        fail()
        return false
      }
    }
    send({ type: 'probe', fps: fps() })
    /** Sends the worker the generators a document uses, once each, before it needs them. */
    function register(doc: AuroraDocument) {
      for (const { type } of doc.layers) {
        const generator = registered.has(type) ? undefined : generators(type)
        if (generator && send({ type: 'register', generator: generatorSpec(generator) })) registered.add(type)
      }
    }
    return {
      register,
      ready,
      listeners,
      stats,
      send,
      fail,
      get failed() {
        return failed
      },
    }
  }

  return {
    prepare(doc, output = 'srgb') {
      if (unavailable) return Promise.resolve(false)
      if (!host || host.failed) host = start()
      const current = host
      if (doc) {
        current.register(doc)
        current.send({ type: 'prepare', doc, output })
      }
      if (!current.listeners.size) {
        // Prepared for a background that never mounted: don't keep a worker and a GPU device for it.
        clearTimeout(idle)
        idle = setTimeout(() => {
          if (current.listeners.size) return
          current.fail()
          if (host === current) host = undefined
        }, IDLE_RELEASE_MS)
      }
      return current.ready
    },
    acquire(listener) {
      clearTimeout(idle)
      if (unavailable) return UNAVAILABLE
      if (!host || host.failed) host = start()
      const current = host
      const id = ++nextId
      let released = false
      current.listeners.set(id, listener)
      return {
        ready: current.ready,
        attach(canvas, state) {
          if (released || current.failed) return false
          let offscreen: OffscreenCanvas
          try {
            offscreen = canvas.transferControlToOffscreen()
          } catch {
            return false
          }
          // From here the canvas belongs to the worker: later failures can only fall back to CSS,
          // and a failed send has already told every listener.
          current.register(state.doc)
          current.send({ type: 'attach', id, canvas: offscreen, state }, [offscreen])
          return true
        },
        update(state) {
          if (released) return
          current.register(state.doc)
          current.send({ type: 'update', id, state })
        },
        release() {
          if (released) return
          released = true
          current.listeners.delete(id)
          current.send({ type: 'detach', id })
          if (!current.listeners.size) {
            current.fail()
            if (host === current) host = undefined
          }
        },
      }
    },
    stats() {
      const current = host
      if (!current || current.failed) return Promise.resolve(undefined)
      return new Promise((resolve) => {
        current.stats.push(resolve)
        current.send({ type: 'stats' })
      })
    },
  }
}

/**
 * Main-thread rendering for browsers without WebGPU in workers (some Safari versions). The renderer
 * is loaded on demand, so pages that never need it don't pay for it. When the last surface is
 * released it stays warm for `IDLE_RELEASE_MS` (a route change usually mounts the next background
 * straight away), then its GPU device and pipeline cache are destroyed.
 */
export function createMainThreadBackend(gpu: () => GPU | undefined, fps: () => number, generators: (id: string) => Generator | undefined): Backend {
  const listeners = new Map<number, LeaseListener>()
  let renderer: Promise<Renderer | undefined> | undefined
  let nextId = 0
  let idle: ReturnType<typeof setTimeout> | undefined

  function releaseWhenIdle() {
    clearTimeout(idle)
    idle = setTimeout(() => {
      const current = renderer
      if (listeners.size || !current) return
      renderer = undefined
      void current.then((r) => r?.fail())
    }, IDLE_RELEASE_MS)
  }

  function start(): Promise<Renderer | undefined> {
    return import('./renderer').then(({ Renderer }) => Renderer.create(gpu(), {
      frame: (id) => listeners.get(id)?.frame(),
      fail: () => {
        renderer = undefined
        for (const listener of listeners.values()) listener.fail()
      },
    }, { fps: fps(), generators })).catch(() => undefined)
  }

  return {
    prepare(doc, output = 'srgb') {
      renderer ??= start()
      const current = renderer
      if (!listeners.size) releaseWhenIdle()
      return current.then((r) => {
        if (doc) r?.prepare(doc, output)
        return !!r
      })
    },
    acquire(listener) {
      clearTimeout(idle)
      renderer ??= start()
      const current = renderer
      const id = ++nextId
      let instance: Renderer | undefined
      let released = false
      listeners.set(id, listener)
      return {
        ready: current.then((r) => {
          instance = r
          if (!r && renderer === current) renderer = undefined
          return !!r && !released
        }),
        attach(canvas, state) {
          if (!instance || released || instance.isFailed) return false
          instance.attach(id, canvas, state)
          return true
        },
        update(state) {
          if (!released) instance?.update(id, state)
        },
        release() {
          if (released) return
          released = true
          listeners.delete(id)
          instance?.detach(id)
          if (!listeners.size) releaseWhenIdle()
        },
      }
    },
    async stats() {
      return (await renderer)?.stats
    },
  }
}
