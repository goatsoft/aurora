import type { InteractionOptions } from '@/interactions'
import type { SurfaceState } from '@/protocol'
import type { AuroraInput } from '@goatsoft/aurora-format'
import { assertAurora } from '@goatsoft/aurora-format'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InteractionController } from '@/interactions'
import { mountAurora, setBackends } from '@/surface'

const base: AuroraInput = { format: 'aurora', version: 1, name: 'Input', palette: ['#fff'], layers: [{ type: 'aurora-fbm' }], interactions: [{ type: 'follow', smoothing: 0, bindings: [{ layer: 0, parameter: 'offsetX', input: 'x' }] }] }
let target: HTMLDivElement
let controller: InteractionController
let now = 1000
const render = vi.fn<InteractionOptions['render']>()
const capture = new Set<number>()

beforeEach(() => {
  vi.useFakeTimers()
  now = 1000
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  target = document.createElement('div')
  target.style.cssText = 'width:320px;height:180px;touch-action:pan-y'
  target.tabIndex = 0
  document.body.append(target)
  capture.clear()
  vi.spyOn(target, 'setPointerCapture').mockImplementation((id) => { capture.add(id) })
  vi.spyOn(target, 'hasPointerCapture').mockImplementation((id) => capture.has(id))
  vi.spyOn(target, 'releasePointerCapture').mockImplementation((id) => { capture.delete(id) })
  render.mockReset()
})
afterEach(() => {
  controller.dispose()
  target.remove()
  setBackends(undefined)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function start(extra: Partial<AuroraInput> = {}, drag = false, rect: readonly [number, number, number, number] = [0, 0, 1, 1]) {
  controller = new InteractionController(assertAurora({ ...base, ...extra }), { target, drag, rect: () => rect, render })
}
function pointer(type: string, x = 0.75, y = 0.5, id = 1, pointerType = 'mouse') {
  const box = target.getBoundingClientRect()
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: id, pointerType, button: 0, clientX: box.left + box.width * x, clientY: box.top + box.height * y }))
}
async function tick(ms = 34) {
  now += ms
  await vi.advanceTimersByTimeAsync(ms)
}

describe('interaction container lifecycle', () => {
  it('normalizes input across a cropped shared scene, coalesces events and stops when idle', async () => {
    start({}, false, [0.5, 0, 0.5, 1])
    await tick()
    render.mockClear()
    pointer('pointerenter')
    for (let i = 0; i < 50; i++) pointer('pointermove', 0.5)
    expect(render).not.toHaveBeenCalled()
    await tick()
    expect(render).toHaveBeenCalledOnce()
    expect(render.mock.calls[0]![1]).toEqual([[0.25, 0, 0, 0]])
    expect(() => structuredClone(render.mock.calls[0])).not.toThrow()
    await tick(1000)
    expect(render).toHaveBeenCalledOnce()
    pointer('pointerleave')
    await tick()
    expect(render.mock.calls.at(-1)![1]).toEqual([[0, 0, 0, 0]])
  })

  it('honours focus activation and provides explicit keyboard equivalents', async () => {
    start({ interactions: [{ ...base.interactions![0]!, activation: 'focus' }] })
    pointer('pointerenter')
    pointer('pointermove')
    await tick()
    expect(render.mock.calls.at(-1)![1]).toEqual([[0, 0, 0, 0]])
    target.focus()
    pointer('pointermove')
    await tick()
    expect(render.mock.calls.at(-1)![1]).toEqual([[0.25, 0, 0, 0]])
    controller.move(0.1, 0.5)
    await tick()
    expect(render.mock.calls.at(-1)![1][0]![0]).toBeCloseTo(-0.4)
  })

  it('maps one shared input container to the same scene coordinate on neighbouring surfaces', async () => {
    const box = target.getBoundingClientRect()
    const doc = assertAurora(base)
    const rightRender = vi.fn<InteractionOptions['render']>()
    controller = new InteractionController(doc, { target, drag: false, rect: () => [0, 0, 0.5, 1], bounds: () => new DOMRect(box.left, box.top, box.width / 2, box.height), render })
    const right = new InteractionController(doc, { target, drag: false, rect: () => [0.5, 0, 0.5, 1], bounds: () => new DOMRect(box.left + box.width / 2, box.top, box.width / 2, box.height), render: rightRender })
    pointer('pointerenter')
    pointer('pointermove', 0.75)
    await tick()
    expect(render.mock.calls.at(-1)![1]).toEqual([[0.25, 0, 0, 0]])
    expect(rightRender.mock.calls.at(-1)![1]).toEqual(render.mock.calls.at(-1)![1])
    right.dispose()
  })

  it('preserves touch scrolling until the host opts into dragging and restores it on disposal', async () => {
    const grab: AuroraInput['interactions'] = [{ type: 'grab', bindings: [{ layer: 0, parameter: 'offsetX', input: 'x' }] }]
    start({ interactions: grab })
    expect(target.style.touchAction).toBe('pan-y')
    pointer('pointerdown', 0.5, 0.5, 1, 'touch')
    pointer('pointermove', 0.75, 0.5, 1, 'touch')
    await tick()
    expect(capture.size).toBe(0)
    expect(render.mock.calls.at(-1)![1]).toEqual([[0, 0, 0, 0]])
    controller.dispose()
    start({ interactions: grab }, true)
    expect(target.style.touchAction).toBe('none')
    pointer('pointerdown', 0.5, 0.5, 1, 'touch')
    pointer('pointermove', 0.75, 0.5, 1, 'touch')
    await tick()
    expect(capture.has(1)).toBe(true)
    expect(render.mock.calls.at(-1)![1]).toEqual([[0.25, 0, 0, 0]])
    controller.dispose()
    expect(capture.size).toBe(0)
    expect(target.style.touchAction).toBe('pan-y')
  })

  it.each(['pointercancel', 'lostpointercapture'])('clears active gestures on %s', async (event) => {
    start({ interactions: [{ type: 'grab', bindings: [{ layer: 0, parameter: 'offsetX', input: 'x' }] }] }, true)
    pointer('pointerdown', 0.5)
    pointer('pointermove', 0.75)
    await tick()
    expect(render.mock.calls.at(-1)![1][0]![0]).toBe(0.25)
    pointer(event)
    await tick()
    expect(capture.size).toBe(0)
    expect(render.mock.calls.at(-1)![1]).toEqual([[0, 0, 0, 0]])
  })

  it('cancels multiple touches and ignores input while invisible or disposed', async () => {
    start({ interactions: [{ type: 'grab', bindings: [{ layer: 0, parameter: 'offsetX', input: 'x' }] }] }, true)
    pointer('pointerdown', 0.5, 0.5, 1, 'touch')
    pointer('pointermove', 0.75, 0.5, 1, 'touch')
    await tick()
    pointer('pointerdown', 0.3, 0.5, 2, 'touch')
    pointer('pointermove', 1, 0.5, 1, 'touch')
    await tick()
    expect(capture.size).toBe(0)
    expect(render.mock.calls.at(-1)![1]).toEqual([[0, 0, 0, 0]])
    controller.setVisible(false)
    const count = render.mock.calls.length
    controller.move(1, 1)
    controller.activate()
    await tick(1000)
    expect(render).toHaveBeenCalledTimes(count)
    controller.setVisible(true)
    await tick()
    controller.dispose()
    pointer('pointerenter')
    pointer('pointermove')
    controller.move(1, 1)
    await tick(1000)
    expect(render).toHaveBeenCalledTimes(count)
  })

  it('does not hijack content controls or turn a touch scroll into an impulse', async () => {
    start({ interactions: [{ type: 'impulse', bindings: [{ layer: 0, parameter: 'opacity', input: 'strength', amount: -1 }] }] })
    const button = document.createElement('button')
    target.append(button)
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1 }))
    pointer('pointerup')
    await tick()
    expect(render.mock.calls.at(-1)![0].layers[0]!.opacity).toBe(1)
    pointer('pointerdown', 0.5, 0.5, 1, 'touch')
    pointer('pointermove', 0.75, 0.5, 1, 'touch')
    pointer('pointerup', 0.75, 0.5, 1, 'touch')
    await tick()
    expect(render.mock.calls.at(-1)![0].layers[0]!.opacity).toBe(1)
    controller.activate()
    await tick()
    expect(render.mock.calls.at(-1)![0].layers[0]!.opacity).toBeLessThan(0.2)
  })

  it('allows input to redraw a paused surface without changing its ambient clock', async () => {
    vi.useRealTimers()
    const states: SurfaceState[] = []
    const backend = {
      acquire: () => ({ ready: Promise.resolve(true), attach: (_: unknown, state: SurfaceState) => states.push(state) > 0, update: (state: SurfaceState) => { states.push(state) }, release() {} }),
      stats: () => Promise.resolve(undefined),
    }
    setBackends({ main: backend, worker: backend })
    const source = assertAurora(base)
    const surface = mountAurora(target, source, { paused: true })
    await surface.ready
    expect(surface.interactions).toBeDefined()
    await vi.waitFor(() => expect(states.length).toBeGreaterThan(0))
    const first = states[0]!
    surface.interactions!.move(0.75, 0.5)
    await vi.waitFor(() => expect(states.at(-1)).toMatchObject({ transforms: [[0.25, 0, 0, 0]] }))
    expect(first.pausedAt).toBe(first.origin)
    expect(states.at(-1)).toMatchObject({ pausedAt: first.pausedAt, origin: first.origin })
    expect(source.layers[0]!.params).toEqual({})
    surface.dispose()
  })
})
