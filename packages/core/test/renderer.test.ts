import { assertAurora } from '@goatsoft/aurora-format'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SurfaceState } from '@/protocol'
import { Renderer } from '@/renderer'
import { fakeGpu, installGpuGlobals } from './fake-gpu'

installGpuGlobals()
const doc = assertAurora({ format: 'aurora', version: 1, name: 'T', palette: ['#4f8cff'], layers: [{ type: 'aurora-fbm' }] })
const state = (overrides: Partial<SurfaceState> = {}): SurfaceState => ({
  doc,
  width: 100,
  height: 50,
  scene: { width: 100, height: 50, rect: [0, 0, 1, 1] },
  scroll: 0,
  visible: true,
  reduced: false,
  origin: 0,
  output: 'srgb',
  ...overrides,
})

/** Lets timers and promise chains settle. */
async function tick(ms = 34) {
  await vi.advanceTimersByTimeAsync(ms)
}

let fake: ReturnType<typeof fakeGpu>
let now = 0
const events = { frame: vi.fn<(id: number) => void>(), fail: vi.fn<() => void>() }
async function renderer(fps = 30) {
  return Renderer.create(fake.gpu, events, { fps, now: () => now })
}

beforeEach(() => {
  vi.useFakeTimers()
  fake = fakeGpu()
  now = 0
  events.frame.mockReset()
  events.fail.mockReset()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('Renderer', () => {
  it('rejects without WebGPU or an adapter', async () => {
    await expect(Renderer.create(undefined, events, { fps: 30 })).rejects.toThrow('WebGPU is not available.')
    fake.noAdapter()
    await expect(renderer()).rejects.toThrow('No WebGPU adapter.')
  })

  it('reports the first frame only after the GPU has finished it', async () => {
    const r = await renderer()
    fake.holdWork()
    r.attach(1, new fake.Canvas() as unknown as OffscreenCanvas, state())
    await tick()
    await tick()
    expect(fake.log.submits).toBe(1)
    expect(events.frame).not.toHaveBeenCalled()
    fake.finishWork()
    await tick(0)
    expect(events.frame).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('never queues a second batch before the first completes, at the shared fps budget', async () => {
    const r = await renderer(30)
    r.attach(1, new fake.Canvas() as unknown as OffscreenCanvas, state())
    r.attach(2, new fake.Canvas() as unknown as OffscreenCanvas, state())
    await tick(34) // compile
    await tick(34)
    expect(fake.log.submits).toBe(1)
    expect(fake.log.passes).toBe(2)
    fake.holdWork()
    await tick(34)
    await tick(500)
    expect(fake.log.submits).toBe(2)
    fake.finishWork()
    await tick(34)
    expect(fake.log.submits).toBe(3)
    expect(r.stats).toMatchObject({ surfaces: 2, frames: 2 })
  })

  it('sizes canvases, configures the colour space and passes the clock', async () => {
    const r = await renderer()
    const canvas = new fake.Canvas()
    now = 5000
    r.attach(1, canvas as unknown as OffscreenCanvas, state({ origin: 1000, output: 'display-p3' }))
    await tick()
    await tick()
    expect([canvas.width, canvas.height]).toEqual([100, 50])
    expect(fake.log.configures).toEqual(['display-p3'])
    expect(fake.log.writes.at(-1)!.slice(0, 4)).toEqual(new Float32Array([100, 50, 4, 0]))
  })

  it('pauses invisible surfaces and renders reduced "still" once per change', async () => {
    const r = await renderer()
    r.attach(1, new fake.Canvas() as unknown as OffscreenCanvas, state({ visible: false }))
    await tick()
    await tick()
    expect(fake.log.passes).toBe(0)
    r.update(1, state({ reduced: 'still' }))
    await tick()
    await tick()
    await tick()
    await tick()
    expect(fake.log.passes).toBe(1)
    expect(fake.log.writes.at(-1)![2]).toBe(0)
    r.update(1, state({ reduced: 'still', scroll: 0.5 }))
    await tick()
    expect(fake.log.passes).toBe(2)
    r.update(7, state())
  })

  it('slows time to a tenth for reduced "slow"', async () => {
    const r = await renderer()
    now = 10_000
    r.attach(1, new fake.Canvas() as unknown as OffscreenCanvas, state({ reduced: 'slow' }))
    await tick()
    await tick()
    expect(fake.log.writes.at(-1)![2]).toBeCloseTo(1, 5)
  })

  it('waits for pipelines to compile and shares them between surfaces', async () => {
    fake.holdPipelines()
    const r = await renderer()
    r.attach(1, new fake.Canvas() as unknown as OffscreenCanvas, state())
    r.attach(2, new fake.Canvas() as unknown as OffscreenCanvas, state())
    await tick()
    await tick()
    expect(fake.log.passes).toBe(0)
    expect(fake.log.pipelines).toBe(1)
    fake.finishPipelines()
    await tick()
    expect(fake.log.passes).toBe(2)
  })

  it('recreates the uniform buffer when the layer stack grows', async () => {
    const r = await renderer()
    r.attach(1, new fake.Canvas() as unknown as OffscreenCanvas, state())
    await tick()
    await tick()
    const two = assertAurora({ ...doc, layers: [{ type: 'aurora-fbm' }, { type: 'aurora-fbm', blend: 'screen' }] })
    r.update(1, state({ doc: two }))
    await tick()
    await tick()
    await tick()
    expect(fake.log.buffers).toBe(2)
    expect(fake.log.destroyedBuffers).toBe(1)
  })

  it('recovers from one device loss without the page noticing', async () => {
    const r = await renderer()
    r.attach(1, new fake.Canvas() as unknown as OffscreenCanvas, state())
    await tick()
    await tick()
    expect(events.frame).toHaveBeenCalledTimes(1)
    fake.device.lose()
    await tick()
    await tick()
    await tick()
    expect(fake.log.devices).toBe(2)
    expect(fake.log.configures).toHaveLength(2)
    expect(events.frame).toHaveBeenCalledTimes(2)
    expect(events.fail).not.toHaveBeenCalled()
    fake.device.lose()
    await tick()
    expect(events.fail).toHaveBeenCalledOnce()
    expect(r.isFailed).toBe(true)
  })

  it('fails when recovery fails', async () => {
    const r = await renderer()
    fake.noAdapter()
    fake.device.lose()
    await tick()
    expect(events.fail).toHaveBeenCalledOnce()
    r.attach(1, new fake.Canvas() as unknown as OffscreenCanvas, state())
    expect(r.stats.surfaces).toBe(0)
  })

  it('fails on uncaptured GPU errors and releases every surface', async () => {
    const r = await renderer()
    r.attach(1, new fake.Canvas() as unknown as OffscreenCanvas, state())
    await tick()
    await tick()
    fake.device.error()
    expect(events.fail).toHaveBeenCalledOnce()
    expect(fake.log.unconfigures).toBe(1)
    expect(fake.log.destroyedBuffers).toBe(1)
    r.fail()
    expect(events.fail).toHaveBeenCalledOnce()
  })

  it('fails when a canvas has no WebGPU context', async () => {
    const r = await renderer()
    const canvas = { width: 1, height: 1, getContext: () => null }
    r.attach(1, canvas as unknown as OffscreenCanvas, state())
    await tick()
    await tick()
    expect(events.fail).toHaveBeenCalledOnce()
  })

  it('releases detached surfaces', async () => {
    const r = await renderer()
    r.attach(1, new fake.Canvas() as unknown as OffscreenCanvas, state())
    await tick()
    await tick()
    r.detach(1)
    r.detach(1)
    expect(fake.log.destroyedBuffers).toBe(1)
    expect(r.stats.surfaces).toBe(0)
  })
})
