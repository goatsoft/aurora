import type { AuroraDocument, AuroraInteraction, ModifierControl } from '@goatsoft/aurora-format'
import { MODIFIERS } from '@goatsoft/aurora-format'
import { GENERATORS } from './generators/index'

export interface InteractionSample {
  x: number
  y: number
  strength: number
  travel: number
}

export type LayerTransform = readonly [number, number, number, number]
export interface InteractionFrame {
  samples: InteractionSample[]
  moving: boolean
  /** A quiet reduced-motion response needs only one delayed update, when it expires. */
  expiresIn?: number
}

const zero = (): InteractionSample => ({ x: 0, y: 0, strength: 0, travel: 0 })
export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0))
const small = (value: number) => Math.abs(value) < 0.0001 ? 0 : value

/** Deterministic gesture physics. Input and time are supplied by the host, never saved in a document. */
export class InteractionState {
  private x = 0
  private y = 0
  private tx = 0
  private ty = 0
  private vx = 0
  private vy = 0
  private anchor: [number, number] | undefined
  private previous = 0
  private moved = 0
  private activity = 0
  private pulses: { x: number, y: number, start: number }[] = []

  constructor(public config: AuroraInteraction) {}

  move(x: number, y: number, now: number): void {
    x = clamp(x) - 0.5
    y = clamp(y) - 0.5
    if (this.config.type === 'follow') {
      const distance = Math.hypot(x - this.tx, y - this.ty)
      if (distance > 0.0001) {
        this.activity = clamp(this.activity + distance * 4)
        this.moved = now
      }
      this.tx = x
      this.ty = y
    } else if (this.config.type === 'grab' && this.anchor) {
      const dx = clamp(x - this.anchor[0], -0.5, 0.5)
      const dy = clamp(y - this.anchor[1], -0.5, 0.5)
      const dt = Math.max(0.016, (now - this.moved) / 1000)
      this.vx = clamp((dx - this.x) / dt, -4, 4)
      this.vy = clamp((dy - this.y) / dt, -4, 4)
      this.x = dx
      this.y = dy
      this.moved = now
    }
  }

  leave(): void {
    this.tx = this.ty = 0
    this.activity = 0
  }

  activate(x: number, y: number, now: number): void {
    if (this.config.type !== 'impulse') return
    this.pulses.unshift({ x: clamp(x) - 0.5, y: clamp(y) - 0.5, start: now })
    this.pulses.length = Math.min(4, this.pulses.length)
  }

  grab(x: number, y: number, now: number): void {
    if (this.config.type !== 'grab') return
    this.anchor = [clamp(x) - 0.5, clamp(y) - 0.5]
    this.x = this.y = this.vx = this.vy = 0
    this.moved = now
  }

  release(now: number): void {
    this.anchor = undefined
    // A drag held still before release has no fling velocity.
    if (now - this.moved > 80) this.vx = this.vy = 0
  }

  reset(): void {
    this.x = this.y = this.tx = this.ty = this.vx = this.vy = this.previous = this.activity = 0
    this.anchor = undefined
    this.pulses = []
  }

  frame(now: number, reduced = false): InteractionFrame {
    const config = this.config
    const dt = this.previous ? clamp((now - this.previous) / 1000, 0, 1 / 15) : 1 / 30
    this.previous = now
    if (config.type === 'impulse') {
      this.pulses = this.pulses.filter((pulse) => now - pulse.start < config.decay * 1000)
      const samples = Array.from({ length: 4 }, (_, slot) => {
        const pulse = this.pulses[slot]
        if (!pulse) return zero()
        const age = Math.max(0, (now - pulse.start) / 1000)
        return { x: pulse.x, y: pulse.y, strength: config.strength * (reduced ? 1 : (1 - age / config.decay) ** 2), travel: reduced ? Math.min(0.4, config.decay * 0.25) : age }
      })
      const expiresIn = this.pulses.length ? Math.max(1, Math.min(...this.pulses.map((p) => p.start + config.decay * 1000 - now))) : undefined
      const animated = config.bindings.some((binding) => binding.input === 'strength' || binding.input === 'travel')
      return { samples, moving: !reduced && animated && !!this.pulses.length, ...(expiresIn === undefined ? {} : { expiresIn }) }
    }
    if (config.type === 'follow') {
      const rate = reduced || config.smoothing === 0 ? 1 : 1 - Math.exp(-dt / (config.smoothing * (this.tx === 0 && this.ty === 0 ? config.decay : 0.35)))
      this.x += (this.tx - this.x) * rate
      this.y += (this.ty - this.y) * rate
      if (Math.abs(this.tx - this.x) < 0.0001) this.x = this.tx
      if (Math.abs(this.ty - this.y) < 0.0001) this.y = this.ty
    } else if (!this.anchor) {
      if (reduced) this.x = this.y = this.vx = this.vy = 0
      else {
        const steps = Math.max(1, Math.ceil(dt * 120))
        const step = dt / steps
        for (let i = 0; i < steps; i++) {
          const spring = 90 / config.decay ** 2
          const damping = (4 + config.damping * 24) / config.decay
          this.vx += (-this.x * spring - this.vx * damping) * step
          this.vy += (-this.y * spring - this.vy * damping) * step
          this.x = clamp(this.x + this.vx * step, -0.5, 0.5)
          this.y = clamp(this.y + this.vy * step, -0.5, 0.5)
        }
        this.x = small(this.x)
        this.y = small(this.y)
        this.vx = small(this.vx)
        this.vy = small(this.vy)
      }
    }
    const age = Math.max(0, (now - this.moved) / 1000)
    const active = config.type === 'follow' && this.activity > 0 && age < config.decay
    const strength = config.type === 'follow' ? (active ? this.activity * (reduced ? 1 : (1 - age / config.decay) ** 2) : 0) : clamp(Math.hypot(this.x, this.y) * 2)
    const usesStrength = config.bindings.some((binding) => binding.input === 'strength')
    const moving = config.type === 'follow' ? this.x !== this.tx || this.y !== this.ty || (!reduced && active && usesStrength) : !this.anchor && !!(this.x || this.y || this.vx || this.vy)
    return { samples: [{ x: this.x * config.strength, y: this.y * config.strength, strength: strength * config.strength, travel: 0 }], moving, ...(reduced && active && usesStrength ? { expiresIn: Math.max(1, (config.decay - age) * 1000) } : {}) }
  }
}

/** Apply input to a copy, clamped by the same specs Studio uses. The authored document is untouched. */
export function resolveInteractionFrame(doc: AuroraDocument, frames: InteractionFrame[]): { doc: AuroraDocument, transforms: LayerTransform[] } {
  const layers = doc.layers.map((layer) => ({ ...layer, params: { ...layer.params } }))
  const transforms: [number, number, number, number][] = layers.map(() => [0, 0, 0, 0])
  const signal = doc.modifiers?.signal ? { ...doc.modifiers.signal } : undefined
  doc.interactions?.forEach((module, i) => {
    for (const binding of module.bindings) {
      const sample = frames[i]?.samples[binding.slot] ?? zero()
      const input = sample[binding.input] * binding.amount
      if (binding.parameter.startsWith('signal.')) {
        if (!signal) continue
        const name = binding.parameter.slice(7)
        const controls: Record<string, ModifierControl> = MODIFIERS.signal.controls
        const control = Object.hasOwn(controls, name) ? controls[name] : undefined
        if (control) {
          const values: Record<string, number> = signal
          values[name] = clamp(values[name]! + input, control.min, control.max)
        }
        continue
      }
      const index = binding.layer
      if (index === undefined) continue
      const layer = layers[index]
      if (!layer) continue
      const transform = transforms[index]!
      if (binding.parameter === 'offsetX' || binding.parameter === 'offsetY') {
        const axis = binding.parameter === 'offsetX' ? 0 : 1
        transform[axis] = clamp(transform[axis] + input, -0.5, 0.5)
      } else if (binding.parameter === 'time') {
        transform[2] = Math.max(0, input)
        transform[3] = 1
      } else if (binding.parameter === 'opacity') layer.opacity = clamp(layer.opacity + input)
      else {
        const params = GENERATORS[layer.type]?.params
        const control = params && Object.hasOwn(params, binding.parameter) ? params[binding.parameter] : undefined
        if (!control) continue
        const value = layer.params[binding.parameter]
        const base = typeof value === 'number' ? value : typeof value === 'boolean' ? Number(value) : control.default
        layer.params[binding.parameter] = clamp(base + input, control.min, control.max)
      }
    }
  })
  return { doc: { ...doc, layers, ...(signal ? { modifiers: { ...doc.modifiers, signal } } : {}) }, transforms }
}
