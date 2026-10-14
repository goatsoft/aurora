import type { AuroraInput, InteractionInput } from '@goatsoft/aurora-format'
import { assertAurora } from '@goatsoft/aurora-format'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { loadGenerators } from '@/generators/index'
import { InteractionState, resolveInteractionFrame } from '@/interaction-state'
import { compose } from '@/shader'
import { packUniforms } from '@/uniforms'

await loadGenerators(['ping'])
const binding = { layer: 0, parameter: 'offsetX', input: 'x' as const }
const base: AuroraInput = { format: 'aurora', version: 1, name: 'Input', palette: ['#fff'], layers: [{ type: 'aurora-fbm' }] }
function document(module: InteractionInput) {
  return assertAurora({ ...base, interactions: [module] })
}
function model(type: InteractionInput['type'], options: Partial<InteractionInput> = {}) {
  return new InteractionState(document({ type, bindings: [binding], ...options }).interactions![0]!)
}

describe('Follow', () => {
  it('eases towards a normalized pointer, settles without idle frames and returns to rest', () => {
    const follow = model('follow')
    follow.move(1, 0, 1000)
    const first = follow.frame(1000)
    expect(first.samples[0]!.x).toBeGreaterThan(0)
    expect(first.samples[0]!.x).toBeLessThan(0.5)
    expect(first.moving).toBe(true)
    let frame = first
    for (let time = 1034; time < 10_000; time += 34) frame = follow.frame(time)
    expect(frame.samples[0]).toMatchObject({ x: 0.5, y: -0.5 })
    expect(frame.moving).toBe(false)
    follow.leave()
    for (let time = 10_000; time < 25_000; time += 34) frame = follow.frame(time)
    expect(frame.samples[0]).toMatchObject({ x: 0, y: 0, strength: 0 })
    expect(frame.moving).toBe(false)
  })

  it('responds immediately under reduced motion or with no smoothing', () => {
    for (const reduced of [true, false]) {
      const follow = model('follow', { smoothing: reduced ? 0.8 : 0 })
      follow.move(0.75, 0.25, 1000)
      expect(follow.frame(1000, reduced)).toMatchObject({ samples: [{ x: 0.25, y: -0.25 }], moving: false })
      follow.leave()
      expect(follow.frame(1100, reduced)).toMatchObject({ samples: [{ x: 0, y: 0 }], moving: false })
    }
  })
})

describe('Impulse', () => {
  it('keeps at most four impulses, newest first, and expires them completely', () => {
    const impulse = model('impulse', { decay: 1 })
    for (let i = 0; i < 10; i++) impulse.activate(i / 10, 0.5, 1000 + i * 10)
    const frame = impulse.frame(1100)
    expect(frame.samples).toHaveLength(4)
    expect(frame.samples.map((sample) => sample.x)).toEqual([0.4, 0.30000000000000004, 0.19999999999999996, 0.09999999999999998])
    expect(frame.samples[0]!.strength).toBeGreaterThan(frame.samples[3]!.strength)
    expect(impulse.frame(2100)).toMatchObject({ moving: false, samples: Array.from({ length: 4 }, () => ({ x: 0, y: 0, strength: 0, travel: 0 })) })
  })

  it('uses a quiet still response and one expiry under reduced motion', () => {
    const impulse = model('impulse')
    impulse.activate(0.7, 0.3, 1000)
    const frame = impulse.frame(1250, true)
    expect(frame).toMatchObject({ moving: false, expiresIn: 750 })
    expect(frame.samples[0]).toMatchObject({ strength: 1, travel: 0 })
    expect(impulse.frame(2000, true).expiresIn).toBeUndefined()
  })
})

describe('Grab & Release', () => {
  it('bounds high release velocity and springs back until idle', () => {
    const grab = model('grab', { damping: 0.4 })
    grab.grab(0.5, 0.5, 1000)
    grab.move(1, 0, 1001)
    expect(grab.frame(1001).samples[0]).toMatchObject({ x: 0.5, y: -0.5 })
    grab.release(1002)
    let crossed = false
    let frame = grab.frame(1034)
    for (let time = 1068; time < 20_000; time += 34) {
      frame = grab.frame(time)
      expect(Math.abs(frame.samples[0]!.x)).toBeLessThanOrEqual(0.5)
      expect(Number.isFinite(frame.samples[0]!.y)).toBe(true)
      crossed ||= frame.samples[0]!.x < 0
    }
    expect(crossed).toBe(true)
    expect(frame.moving).toBe(false)
    expect(frame.samples[0]).toMatchObject({ x: 0, y: 0, strength: 0 })
  })

  it('clears immediately on reset and releases without overshoot under reduced motion', () => {
    const grab = model('grab')
    grab.grab(0.5, 0.5, 1000)
    grab.move(0.8, 0.2, 1100)
    expect(grab.frame(1100, true).samples[0]!.x).toBeCloseTo(0.3)
    grab.release(1110)
    expect(grab.frame(1150, true)).toMatchObject({ moving: false, samples: [{ x: 0, y: 0 }] })
    grab.activate(1, 1, 1200)
    grab.reset()
    expect(grab.frame(1250)).toMatchObject({ moving: false, samples: [{ x: 0, y: 0 }] })
  })

  it('keeps arbitrary coordinates and timing finite and bounded', () => {
    fc.assert(fc.property(fc.double({ noNaN: true }), fc.double({ noNaN: true }), fc.integer({ min: 0, max: 100_000 }), (x, y, time) => {
      const grab = model('grab')
      grab.grab(0.5, 0.5, 1000)
      grab.move(x, y, 1000 + time)
      grab.release(1001 + time)
      const sample = grab.frame(1034 + time).samples[0]!
      for (const value of [sample.x, sample.y]) {
        expect(Number.isFinite(value)).toBe(true)
        expect(Math.abs(value)).toBeLessThanOrEqual(0.5)
      }
    }))
  })
})

describe('render bindings', () => {
  it('composes clamped parameter/modifier changes and offsets without touching the authored document', () => {
    const doc = assertAurora({ ...base, modifiers: { signal: { amount: 0.2 } }, interactions: [{ type: 'follow', bindings: [
      binding, { ...binding, parameter: 'offsetY', input: 'y', amount: -0.2 },
      { ...binding, parameter: 'intensity', input: 'strength', amount: 4 },
      { parameter: 'signal.amount', input: 'strength', amount: 4 },
    ] }] })
    const before = structuredClone(doc)
    const state = new InteractionState(doc.interactions![0]!)
    state.move(1, 1, 1000)
    const resolved = resolveInteractionFrame(doc, [state.frame(1000, true)])
    expect(resolved.transforms[0]).toEqual([0.5, -0.1, 0, 0])
    expect(resolved.doc.layers[0]!.params['intensity']).toBe(2)
    expect(resolved.doc.modifiers!.signal!.amount).toBe(1)
    expect(doc).toEqual(before)
    expect(compose(resolved.doc).key).toBe(compose(doc).key)
  })

  it('gives Ping an independent clock so tapping works while ambient animation is paused', () => {
    const doc = assertAurora({ ...base, layers: [{ type: 'ping', opacity: 0 }], interactions: [{ type: 'impulse', bindings: [
      { layer: 0, parameter: 'x', input: 'x' }, { layer: 0, parameter: 'y', input: 'y' },
      { layer: 0, parameter: 'time', input: 'travel' }, { layer: 0, parameter: 'opacity', input: 'strength' },
    ] }] })
    const state = new InteractionState(doc.interactions![0]!)
    state.activate(0.75, 0.25, 1000)
    const resolved = resolveInteractionFrame(doc, [state.frame(1250)])
    expect(resolved.doc.layers[0]!.params).toEqual({ x: 0.75, y: 0.25 })
    expect(resolved.doc.layers[0]!.opacity).toBe(0.5625)
    expect(resolved.transforms[0]).toEqual([0, 0, 0.25, 1])
    const shader = compose(doc)
    const uniforms = packUniforms(resolved.doc, shader, { width: 256, height: 144, time: 7, scroll: 0, transforms: resolved.transforms })
    expect(uniforms[2]).toBe(7)
    expect(uniforms.slice((shader.layers[0]!.colors - 1) * 4, shader.layers[0]!.colors * 4)).toEqual(new Float32Array([0, 0, 0.25, 1]))
  })
})
