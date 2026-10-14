import type { AuroraSource } from './module'
import type { Backend, Lease } from './pool'
import type { SurfaceState } from './protocol'
import type { SceneMember } from './scene'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import type { RgbSpace } from '@goatsoft/color'
import { getConfig, renderRatio } from './config'
import { compileCss, DRIFT_KEYFRAMES } from './css'
import { GENERATORS, loadGenerators } from './generators/index'
import { isAuroraModule, plainDocument, watchModule } from './module'
import { createMainThreadBackend, createWorkerBackend } from './pool'
import { joinScene, sceneGeometry } from './scene'

/** What a surface is showing right now. It only says "webgpu" once a real frame is on screen. */
export type AuroraMode = 'css' | 'webgpu'

export interface MountOptions {
  /** Start with the ambient clock paused. Input and document changes can still redraw. */
  paused?: boolean
  /** Join a named scene: members share one clock and one continuous field. */
  scene?: string
  /** Aborting disposes the surface. */
  signal?: AbortSignal
  onModeChange?: (mode: AuroraMode) => void
  /**
   * Why the background is showing its CSS fallback when it could be using WebGPU: a generator
   * that didn't load or isn't registered, or a GPU that failed to start or stopped. The CSS
   * fallback stays on screen either way; this is for logging and diagnostics.
   */
  onError?: (error: Error) => void
}

export interface AuroraSurface {
  readonly mode: AuroraMode
  readonly paused: boolean
  /** Freeze at the current animation phase, without changing the document. */
  pause: () => void
  /** Continue from the frozen phase. */
  resume: () => void
  /** The element Aurora added to the host. */
  readonly element: HTMLElement
  /** Swaps the document. Values update in place; a new layer stack compiles in the background. */
  update: (source: AuroraSource) => void
  dispose: () => void
  /**
   * Resolves once the generators the first document uses have loaded and the CSS fallback is
   * painted from them. Server-rendered bindings keep their own fallback on screen until then.
   */
  readonly ready: Promise<void>
}

const generators = (id: string) => GENERATORS[id]
let backends: { worker: Backend, main: Backend } | undefined
function getBackends() {
  backends ??= {
    worker: createWorkerBackend(
      () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'Aurora' }),
      () => getConfig().fps,
      generators,
    ),
    main: createMainThreadBackend(() => navigator.gpu, () => getConfig().fps, generators),
  }
  return backends
}

/** The active backends, for `auroraStats`. */
export function getBackendsForStats(): { worker: Backend, main: Backend } {
  return getBackends()
}

/** Replaces the rendering backends. For tests and for hosts with their own worker setup. */
export function setBackends(next: { worker: Backend, main: Backend } | undefined): void {
  backends = next
}

/**
 * How a background fills its positioned parent. Bindings put it on their host element so server
 * HTML and the mounted surface agree; it's the only layout CSS Aurora ships.
 */
export const FILL_STYLE = 'position:absolute;inset:0;overflow:hidden;pointer-events:none'

const CROSSFADE_MS = 300
const epochNow = () => performance.timeOrigin + performance.now()
const media = (query: string) => typeof matchMedia === 'function' && matchMedia(query).matches

let surfaces = 0
/**
 * User Timing marks for each step to the first WebGPU frame, so DevTools' Performance panel (or a
 * PerformanceObserver) shows where the time goes. `detail.surface` tells backgrounds apart.
 */
function mark(name: 'mount' | 'generators' | 'gpu' | 'attach' | 'frame', surface: number) {
  performance.mark(`aurora:${name}`, { detail: { surface } })
}

/** The colour space a document renders in: Display P3 where the screen has it and a layer mixes in OKLab. */
export function outputFor(doc: AuroraDocument): RgbSpace {
  return media('(color-gamut: p3)') && doc.layers.some((l) => l.mix === 'oklab') ? 'display-p3' : 'srgb'
}

/** Whether this page renders through the worker: it needs worker WebGPU and transferable canvases. */
export function usesWorker(): boolean {
  return getConfig().worker && typeof Worker !== 'undefined' && typeof HTMLCanvasElement !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype
}

/** Whether WebGPU may be tried at all here (the CSS fallback is used otherwise). */
export function gpuAllowed(): boolean {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false
  return !(getConfig().touch === 'css' && media('(pointer: coarse)'))
}

/**
 * Gets backgrounds ready before they mount, so they can show WebGPU straight away: starts the GPU,
 * downloads the generators the documents use, and compiles their shaders. Call it as early as you
 * know which backgrounds a page shows, for example when a route starts loading. It does nothing on
 * the server or where the CSS fallback will be used, and is safe to call more than once. A GPU
 * started for backgrounds that never mount is released after a few seconds.
 *
 * Resolves once the generators have loaded; compiling carries on in the background.
 */
export async function prepareAurora(...sources: AuroraSource[]): Promise<void> {
  if (typeof window === 'undefined') return
  const docs = sources.map(plainDocument)
  const { worker, main } = getBackends()
  let backend = gpuAllowed() ? (usesWorker() ? worker : main) : undefined
  // The device starts while the generators download.
  const ready = backend?.prepare?.()
  await loadGenerators(docs.flatMap((doc) => doc.layers.map((layer) => layer.type)))
  if (!backend) return
  // A worker that fails its probe means backgrounds will render on the main thread: warm that up.
  if (backend === worker && (await ready) === false) {
    backend = main
    void main.prepare?.()
  }
  const css = media('(prefers-reduced-motion: reduce)')
  for (const doc of docs) {
    if (css && doc.motion.reduced === 'css') continue
    if (doc.layers.every((layer) => layer.type in GENERATORS)) void backend.prepare?.(doc, outputFor(doc))
  }
}

let keyframesInstalled = false
function installKeyframes() {
  if (keyframesInstalled || typeof CSSStyleSheet === 'undefined') return
  keyframesInstalled = true
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(DRIFT_KEYFRAMES)
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
}

/**
 * Mounts an Aurora background into `host`, filling it. The CSS fallback paints immediately; WebGPU
 * takes over with a crossfade once its first frame is on screen. Rendering pauses off-screen and
 * in hidden tabs, honours reduced motion, and falls back to CSS on any GPU failure.
 *
 * `source` is a validated document or an imported `.aurora` module; modules hot-update in place.
 */
export function mountAurora(host: HTMLElement, source: AuroraSource, options: MountOptions = {}): AuroraSurface {
  const surfaceId = ++surfaces
  mark('mount', surfaceId)
  let doc = plainDocument(source)
  /** An imported module's precompiled fallback: right from the first paint, before generators load. */
  let precompiled = isAuroraModule(source) ? source.css : undefined
  // Hot updates from the module's own watcher apply in place; update() is for a new source.
  let unwatch = isAuroraModule(source) ? watchModule(source.id, (next) => apply(next)) : undefined
  let mode: AuroraMode = 'css'
  let disposed = false
  let pausedAt = options.paused ? epochNow() : undefined
  let lease: Lease | undefined
  let visible = true
  let fadeTimer: ReturnType<typeof setTimeout> | undefined
  const listeners = new AbortController()
  const on = { signal: listeners.signal, passive: true }

  if (getComputedStyle(host).position === 'static') host.style.position = 'relative'
  installKeyframes()

  const root = document.createElement('div')
  root.setAttribute('aria-hidden', 'true')
  root.dataset['aurora'] = 'css'
  root.style.cssText = `${FILL_STYLE};contain:strict`
  const fallback = document.createElement('div')
  const newCanvas = () => {
    const c = document.createElement('canvas')
    c.style.cssText = `position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity ${CROSSFADE_MS}ms ease`
    return c
  }
  // Replaced after a fallback to CSS: a canvas handed to the worker can't be handed over again.
  let canvas = newCanvas()
  root.append(fallback, canvas)
  host.append(root)

  const reducedQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : undefined
  const reduced = (): SurfaceState['reduced'] => (reducedQuery?.matches ? (doc.motion.reduced === 'slow' ? 'slow' : 'still') : false)
  const cssOnly = () => !!reducedQuery?.matches && doc.motion.reduced === 'css'

  function paintFallback() {
    // Until every generator has loaded, compileCss would leave their layers out.
    const css = precompiled && !loaded() ? precompiled : compileCss(doc)
    root.style.position = doc.canvas.fixed ? 'fixed' : 'absolute'
    const drift = mode === 'css' && css.drift > 0 && !reducedQuery?.matches
    fallback.style.cssText = `position:absolute;inset:-10%;${css.style}${drift ? `;animation:aurora-drift ${css.drift}s ease-in-out infinite;will-change:transform` : ''}`
    fallback.style.animationPlayState = pausedAt === undefined ? 'running' : 'paused'
    // While a plain document's generators are still loading, its fallback would be missing their
    // layers: show nothing of ours yet (a server-rendered fallback underneath covers it).
    const incomplete = loading && !precompiled && !loaded()
    fallback.style.visibility = mode === 'webgpu' || incomplete ? 'hidden' : 'visible'
  }

  const member: SceneMember = {
    rect() {
      const r = root.getBoundingClientRect()
      return doc.canvas.fixed ? r : { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height }
    },
    changed: () => push(),
  }
  const scene = options.scene ? joinScene(options.scene, member, epochNow()) : undefined
  let origin = scene?.origin ?? pausedAt ?? epochNow()

  const output = () => outputFor(doc)

  function state(): SurfaceState {
    const r = root.getBoundingClientRect()
    const ratio = renderRatio(devicePixelRatio, r.width, r.height)
    const geometry = options.scene ? sceneGeometry(options.scene, member) : { width: r.width, height: r.height, rect: [0, 0, 1, 1] as const }
    return {
      doc,
      width: Math.max(2, Math.round(r.width * ratio)),
      height: Math.max(2, Math.round(r.height * ratio)),
      scene: { width: Math.max(2, geometry.width * ratio), height: Math.max(2, geometry.height * ratio), rect: geometry.rect },
      scroll: doc.canvas.fixed ? (scrollY / Math.max(1, innerHeight)) * doc.canvas.parallax : 0,
      visible: visible && !document.hidden,
      reduced: reduced(),
      origin,
      ...(pausedAt === undefined ? {} : { pausedAt }),
      output: output(),
    }
  }

  const isDisposed = () => disposed
  /** Whether every generator the document uses is loaded (built-ins load lazily on first use). */
  const loaded = () => doc.layers.every((layer) => layer.type in GENERATORS)

  function push() {
    if (!disposed && loaded()) lease?.update(state())
  }

  function pause() {
    if (disposed || pausedAt !== undefined) return
    pausedAt = epochNow()
    fallback.style.animationPlayState = 'paused'
    push()
  }

  function resume() {
    if (disposed || pausedAt === undefined) return
    origin += epochNow() - pausedAt
    pausedAt = undefined
    fallback.style.animationPlayState = 'running'
    push()
  }

  let framed = false
  function setMode(next: AuroraMode) {
    if (mode === next || disposed) return
    mode = next
    root.dataset['aurora'] = next
    clearTimeout(fadeTimer)
    if (next === 'webgpu') {
      if (!framed) mark('frame', surfaceId)
      framed = true
      canvas.style.display = ''
      canvas.style.transition = reducedQuery?.matches ? 'none' : `opacity ${CROSSFADE_MS}ms ease`
      canvas.style.opacity = '1'
      // Keep the CSS underneath until the crossfade has finished, then stop painting it.
      fadeTimer = setTimeout(paintFallback, reducedQuery?.matches ? 0 : CROSSFADE_MS)
    } else {
      canvas.style.opacity = '0'
      canvas.style.display = 'none'
      paintFallback()
    }
    options.onModeChange?.(next)
  }

  const report = (message: string, cause?: unknown) => options.onError?.(new Error(message, cause === undefined ? undefined : { cause }))

  function toCss() {
    const attached = !!lease
    lease?.release()
    lease = undefined
    setMode('css')
    // A canvas that went to the worker can't be transferred again, so a later start needs a new one.
    if (attached) {
      const next = newCanvas()
      next.style.display = 'none'
      canvas.replaceWith(next)
      canvas = next
    }
  }

  /** Whether the current document's generators are still loading. */
  let loading = true
  /** Loads the built-in generators the document uses, then repaints; unknown generators mean CSS. */
  const prepare = () => {
    loading = true
    return loadGenerators(doc.layers.map((layer) => layer.type)).finally(() => {
      loading = false
    }).then(settled, failed)
  }
  function settled() {
    if (disposed) return
    mark('generators', surfaceId)
    paintFallback()
    if (!loaded()) {
      const missing = doc.layers.map((l) => l.type).filter((type) => !(type in GENERATORS))
      report(`Aurora: no generator ${missing.map((type) => `"${type}"`).join(', ')}; showing the CSS fallback.`)
      toCss()
    } else push()
  }
  function failed(error: unknown) {
    if (disposed) return
    report('Aurora: generators failed to load; showing the CSS fallback.', error)
    paintFallback()
    toCss()
  }
  let generatorsReady = prepare()

  async function start() {
    if (disposed || cssOnly() || !gpuAllowed()) return
    const { worker, main } = getBackends()
    const listener = {
      frame: () => setMode('webgpu'),
      fail: () => {
        report('Aurora: the GPU renderer stopped; showing the CSS fallback.')
        toCss()
      },
    }
    const candidates = usesWorker() && 'transferControlToOffscreen' in canvas ? [worker, main] : [main]
    for (const backend of candidates) {
      // The GPU starts while the generators download, rather than after.
      const next = backend.acquire(listener)
      lease = next
      const [ready] = await Promise.all([next.ready, generatorsReady])
      // Awaiting lets dispose() or a newer start() run in between, so re-read the state.
      if (!ready || isDisposed() || lease !== next || !loaded()) {
        next.release()
        if (lease === next) lease = undefined
        if (isDisposed() || !loaded()) return
        continue
      }
      mark('gpu', surfaceId)
      if (next.attach(canvas, state())) {
        mark('attach', surfaceId)
        return
      }
      next.release()
      lease = undefined
    }
    report('Aurora: WebGPU is present but no renderer could start; showing the CSS fallback.')
  }

  paintFallback()
  const io = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting
    push()
  }, { rootMargin: '20%' })
  io.observe(root)
  // A member's size is part of the whole scene's geometry, so its neighbours recompute too.
  const ro = new ResizeObserver(() => {
    push()
    scene?.notify()
  })
  ro.observe(root)
  addEventListener('scroll', () => {
    if (doc.canvas.fixed) push()
  }, on)
  addEventListener('resize', () => push(), on)
  document.addEventListener('visibilitychange', () => push(), on)
  reducedQuery?.addEventListener('change', () => {
    if (cssOnly()) toCss()
    else {
      push()
      if (!lease && mode === 'css') void start()
    }
    paintFallback()
  }, on)

  function dispose() {
    if (disposed) return
    disposed = true
    clearTimeout(fadeTimer)
    listeners.abort()
    io.disconnect()
    ro.disconnect()
    lease?.release()
    lease = undefined
    scene?.leave()
    unwatch?.()
    root.remove()
  }

  /** A new source: watch its module (or stop watching the old one, for a plain document). */
  function update(next: AuroraSource) {
    if (disposed) return
    unwatch?.()
    unwatch = isAuroraModule(next) ? watchModule(next.id, (hot) => apply(hot)) : undefined
    apply(next, isAuroraModule(next) ? next.css : undefined)
  }

  /** Shows a document, from update() or from the current module's hot update. */
  function apply(next: AuroraSource, css?: typeof precompiled) {
    if (disposed) return
    doc = plainDocument(next)
    precompiled = css
    generatorsReady = prepare()
    paintFallback()
    if (cssOnly()) toCss()
    else {
      push()
      if (!lease && mode === 'css') void start()
    }
  }
  options.signal?.addEventListener('abort', dispose, { once: true })
  if (options.signal?.aborted) dispose()
  else void start()
  const ready = generatorsReady

  return {
    get mode() { return mode },
    get paused() { return pausedAt !== undefined },
    pause,
    resume,
    element: root,
    update,
    dispose,
    ready,
  }
}
