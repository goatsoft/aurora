import type { RendererStats, SurfaceState, WorkerRequest, WorkerResponse } from './protocol'
import type { Renderer } from './renderer'

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
  stats: () => Promise<RendererStats | undefined>
}

/** How long the worker gets to prove it can render (ADR-0077). */
export const PROBE_TIMEOUT = 4000

/**
 * The page's worker backend (ADR-0079): one worker, one lease per surface. The worker starts on the
 * first lease and terminates with the last, and any failure moves every surface to CSS.
 */
export function createWorkerBackend(factory: () => Worker, fps: () => number): Backend {
  let host: ReturnType<typeof start> | undefined
  let nextId = 0

  function start() {
    const worker = factory()
    const listeners = new Map<number, LeaseListener>()
    const stats: ((stats: RendererStats) => void)[] = []
    let failed = false
    let resolveReady!: (ready: boolean) => void
    const ready = new Promise<boolean>((resolve) => {
      resolveReady = resolve
    })
    const timeout = setTimeout(fail, PROBE_TIMEOUT)

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
        else fail()
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
    return {
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
    acquire(listener) {
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
          current.send({ type: 'attach', id, canvas: offscreen, state }, [offscreen])
          return true
        },
        update(state) {
          if (!released) current.send({ type: 'update', id, state })
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
 * is loaded on demand, so pages that never need it don't pay for it.
 */
export function createMainThreadBackend(gpu: () => GPU | undefined, fps: () => number): Backend {
  const listeners = new Map<number, LeaseListener>()
  let renderer: Promise<Renderer | undefined> | undefined
  let nextId = 0

  function start(): Promise<Renderer | undefined> {
    return import('./renderer').then(({ Renderer }) => Renderer.create(gpu(), {
      frame: (id) => listeners.get(id)?.frame(),
      fail: () => {
        renderer = undefined
        for (const listener of listeners.values()) listener.fail()
      },
    }, { fps: fps() })).catch(() => undefined)
  }

  return {
    acquire(listener) {
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
        },
      }
    },
    async stats() {
      return (await renderer)?.stats
    },
  }
}
