import type { InteractionFrame, LayerTransform } from './interaction-state'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import { getConfig } from './config'
import { clamp, InteractionState, resolveInteractionFrame } from './interaction-state'

/** Keyboard/programmatic equivalents for the gestures on the input container. Coordinates are scene UV. */
export interface AuroraInteractions {
  move: (x: number, y: number) => void
  leave: () => void
  activate: (x?: number, y?: number) => void
  grab: (x?: number, y?: number) => void
  release: () => void
  reset: () => void
}

export interface InteractionOptions {
  target: HTMLElement
  /** Explicitly opt into pointer dragging. Keyboard/programmatic grabbing does not need it. */
  drag: boolean
  rect: () => readonly [number, number, number, number]
  /** Surface bounds when input is received on a larger shared container. */
  bounds?: () => DOMRectReadOnly
  render: (doc: AuroraDocument, transforms: LayerTransform[]) => void
}

/** Input stays on the page; the existing renderer/worker receives only resolved, plain state. */
export class InteractionController implements AuroraInteractions {
  private models: InteractionState[] = []
  private readonly listeners = new AbortController()
  private readonly media = matchMedia('(prefers-reduced-motion: reduce)')
  private timer: ReturnType<typeof setTimeout> | undefined
  private scheduledAt = 0
  private visible = true
  private disposed = false
  private hovered = false
  private focused = false
  private fingerprint = ''
  private readonly pointers = new Set<number>()
  private press: { id: number, x: number, y: number, px: number, py: number, moved: boolean } | undefined
  private capture: number | undefined
  private readonly touchAction: string

  constructor(private doc: AuroraDocument, private readonly options: InteractionOptions) {
    this.touchAction = options.target.style.touchAction
    this.configure(doc)
    const { target } = options
    const on = { signal: this.listeners.signal, passive: true }
    target.addEventListener('pointerenter', () => {
      this.hovered = true
    }, on)
    target.addEventListener('pointerleave', () => {
      this.hovered = false
      if (this.capture === undefined && !this.focused) this.leave()
    }, on)
    target.addEventListener('focusin', () => {
      this.focused = true
    }, on)
    target.addEventListener('focusout', (event) => {
      if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return
      this.focused = false
      if (!this.hovered) this.leave()
    }, on)
    target.addEventListener('pointermove', (event) => {
      if (this.pointers.size > 1 || !this.visible) return
      const [x, y] = this.point(event)
      if (this.press) this.press.moved ||= Math.hypot(event.clientX - this.press.px, event.clientY - this.press.py) > 8
      const now = performance.now()
      for (const model of this.models) {
        if (model.config.type === 'grab' ? event.pointerId === this.capture : this.active(model)) model.move(x, y, now)
      }
      this.wake()
    }, on)
    target.addEventListener('pointerdown', (event) => {
      if (!this.visible || event.button !== 0 || this.control(event.target)) return
      this.pointers.add(event.pointerId)
      if (this.pointers.size > 1) {
        this.cancel()
        return
      }
      const [x, y] = this.point(event)
      this.hovered = true
      this.press = { id: event.pointerId, x, y, px: event.clientX, py: event.clientY, moved: false }
      const now = performance.now()
      for (const model of this.models) if (this.active(model)) model.move(x, y, now)
      this.wake()
      if (!options.drag || !this.models.some((model) => model.config.type === 'grab' && this.active(model))) return
      this.capture = event.pointerId
      target.setPointerCapture(event.pointerId)
      for (const model of this.models) if (this.active(model)) model.grab(x, y, now)
    }, on)
    const up = (event: PointerEvent) => {
      const press = this.press
      if (press?.id === event.pointerId) {
        if (!press.moved) for (const model of this.models) if (this.active(model)) model.activate(press.x, press.y, performance.now())
        this.release()
      }
      this.pointers.delete(event.pointerId)
      if (event.pointerType === 'touch') {
        this.hovered = false
        this.leave()
      }
    }
    document.addEventListener('pointerup', up, on)
    document.addEventListener('pointercancel', (event) => {
      this.pointers.delete(event.pointerId)
      this.cancel()
    }, on)
    target.addEventListener('lostpointercapture', () => {
      if (this.capture !== undefined) this.cancel()
    }, on)
    this.media.addEventListener('change', () => {
      this.fingerprint = ''
      this.wake()
    }, on)
    this.wake()
  }

  private control(target: EventTarget | null): boolean {
    return target instanceof Element && !!target.closest('a,button,input,select,textarea,[contenteditable="true"],[data-aurora-input-ignore]')
  }

  private active(model: InteractionState): boolean {
    return model.config.activation === 'hover' ? this.hovered : model.config.activation === 'focus' ? this.focused : this.hovered || this.focused
  }

  /** Convert the chosen container into the full shared scene, including cropped surfaces. */
  private point(event: PointerEvent): [number, number] {
    const box = this.options.bounds?.() ?? this.options.target.getBoundingClientRect()
    const rect = this.options.rect()
    return [clamp(rect[0] + (event.clientX - box.left) / Math.max(1, box.width) * rect[2]), clamp(rect[1] + (event.clientY - box.top) / Math.max(1, box.height) * rect[3])]
  }

  configure(doc: AuroraDocument): void {
    this.doc = doc
    this.models = (doc.interactions ?? []).map((config, i) => {
      const model = this.models[i]
      if (model?.config.type !== config.type) return new InteractionState(config)
      model.config = config
      return model
    })
    this.options.target.style.touchAction = this.options.drag && this.models.some((model) => model.config.type === 'grab') ? 'none' : this.touchAction
    this.fingerprint = ''
    this.wake()
  }

  move(x: number, y: number): void {
    if (this.disposed || !this.visible) return
    const now = performance.now()
    for (const model of this.models) model.move(x, y, now)
    this.wake()
  }

  leave(): void {
    for (const model of this.models) model.leave()
    this.wake()
  }

  activate(x = 0.5, y = 0.5): void {
    if (this.disposed || !this.visible) return
    const now = performance.now()
    for (const model of this.models) model.activate(x, y, now)
    this.wake()
  }

  grab(x = 0.5, y = 0.5): void {
    if (this.disposed || !this.visible) return
    const now = performance.now()
    for (const model of this.models) model.grab(x, y, now)
    this.wake()
  }

  release(): void {
    const now = performance.now()
    for (const model of this.models) model.release(now)
    this.releaseCapture()
    this.press = undefined
    this.wake()
  }

  private releaseCapture(): void {
    const id = this.capture
    this.capture = undefined
    if (id !== undefined && this.options.target.hasPointerCapture(id)) this.options.target.releasePointerCapture(id)
  }

  private cancel(): void {
    this.releaseCapture()
    this.press = undefined
    this.reset()
  }

  reset(): void {
    this.releaseCapture()
    this.press = undefined
    for (const model of this.models) model.reset()
    this.wake()
  }

  setVisible(visible: boolean): void {
    if (this.visible === visible) return
    this.visible = visible
    if (!visible) {
      clearTimeout(this.timer)
      this.timer = undefined
      this.pointers.clear()
      this.cancel()
      this.draw()
    } else this.wake()
  }

  private wake(delay = 1000 / getConfig().fps): void {
    if (this.disposed || !this.visible) return
    const due = performance.now() + delay
    if (this.timer !== undefined && due >= this.scheduledAt) return
    clearTimeout(this.timer)
    this.scheduledAt = due
    this.timer = setTimeout(() => {
      this.timer = undefined
      this.draw()
    }, delay)
  }

  private draw(): void {
    if (this.disposed) return
    const frames: InteractionFrame[] = this.models.map((model) => model.frame(performance.now(), this.media.matches))
    const fingerprint = JSON.stringify(frames.map((frame) => frame.samples))
    if (this.fingerprint !== fingerprint) {
      this.fingerprint = fingerprint
      const resolved = resolveInteractionFrame(this.doc, frames)
      this.options.render(resolved.doc, resolved.transforms)
    }
    if (frames.some((frame) => frame.moving)) this.wake()
    else {
      const delays = frames.flatMap((frame) => frame.expiresIn === undefined ? [] : [frame.expiresIn])
      if (delays.length) this.wake(Math.min(...delays))
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    clearTimeout(this.timer)
    this.listeners.abort()
    this.releaseCapture()
    this.pointers.clear()
    this.options.target.style.touchAction = this.touchAction
  }
}
