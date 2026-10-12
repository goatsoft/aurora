import { assertAurora } from '@goatsoft/aurora-format'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PROBE_TIMEOUT, createMainThreadBackend, createWorkerBackend } from '../src/pool'
import type { SurfaceState, WorkerRequest, WorkerResponse } from '../src/protocol'
import { fakeGpu, installGpuGlobals } from './fake-gpu'

installGpuGlobals()
const doc = assertAurora({ format: 'aurora', version: 1, name: 'T', palette: ['#4f8cff'], layers: [{ type: 'aurora-fbm' }] })
const state: SurfaceState = { doc, width: 10, height: 10, scene: { width: 10, height: 10, rect: [0, 0, 1, 1] }, scroll: 0, visible: true, reduced: false, origin: 0, output: 'srgb' }

class FakeWorker {
  static instances: FakeWorker[] = []
  sent: WorkerRequest[] = []
  terminated = false
  throwOnPost = false
  onmessage: ((event: { data: WorkerResponse }) => void) | null = null
  onerror: (() => void) | null = null
  onmessageerror: (() => void) | null = null
  constructor() {
    FakeWorker.instances.push(this)
  }

  postMessage(message: WorkerRequest) {
    if (this.throwOnPost) throw new Error('DataCloneError')
    this.sent.push(message)
  }

  terminate() {
    this.terminated = true
  }

  reply(data: WorkerResponse) {
    this.onmessage?.({ data })
  }
}

const canvas = () => ({ transferControlToOffscreen: () => ({}) }) as unknown as HTMLCanvasElement
const listener = () => ({ frame: vi.fn(), fail: vi.fn() })

beforeEach(() => {
  vi.useFakeTimers()
  FakeWorker.instances = []
})
afterEach(() => {
  vi.useRealTimers()
})

describe('worker backend', () => {
  const backend = () => createWorkerBackend(() => new FakeWorker() as unknown as Worker, () => 24)

  it('shares one worker, probes with the fps budget and transfers canvases after ready', async () => {
    const pool = backend()
    const a = pool.acquire(listener())
    const b = pool.acquire(listener())
    expect(FakeWorker.instances).toHaveLength(1)
    const worker = FakeWorker.instances[0]!
    expect(worker.sent).toEqual([{ type: 'probe', fps: 24 }])
    worker.reply({ type: 'ready', available: true })
    expect(await a.ready).toBe(true)
    expect(a.attach(canvas(), state)).toBe(true)
    a.update(state)
    expect(worker.sent.map((m) => m.type)).toEqual(['probe', 'attach', 'update'])
    a.release()
    a.release()
    a.update(state)
    expect(a.attach(canvas(), state)).toBe(false)
    expect(worker.terminated).toBe(false)
    b.release()
    expect(worker.terminated).toBe(true)
    pool.acquire(listener())
    expect(FakeWorker.instances).toHaveLength(2)
  })

  it('routes first frames to their surface', () => {
    const pool = backend()
    const l = listener()
    pool.acquire(l)
    FakeWorker.instances[0]!.reply({ type: 'frame', id: 1 })
    FakeWorker.instances[0]!.reply({ type: 'frame', id: 99 })
    expect(l.frame).toHaveBeenCalledOnce()
  })

  it.each([
    ['the worker reports no WebGPU', (w: FakeWorker) => w.reply({ type: 'ready', available: false })],
    ['the worker fails later', (w: FakeWorker) => w.reply({ type: 'fail' })],
    ['the worker errors', (w: FakeWorker) => w.onerror?.()],
    ['a message cannot be decoded', (w: FakeWorker) => w.onmessageerror?.()],
  ])('moves every surface to CSS when %s', async (_, failWith) => {
    const pool = backend()
    const l = listener()
    const lease = pool.acquire(l)
    failWith(FakeWorker.instances[0]!)
    expect(await lease.ready).toBe(false)
    expect(l.fail).toHaveBeenCalledOnce()
    expect(FakeWorker.instances[0]!.terminated).toBe(true)
    FakeWorker.instances[0]!.reply({ type: 'frame', id: 1 })
    expect(l.frame).not.toHaveBeenCalled()
  })

  it('gives up when the probe times out', async () => {
    const pool = backend()
    const lease = pool.acquire(listener())
    vi.advanceTimersByTime(PROBE_TIMEOUT)
    expect(await lease.ready).toBe(false)
  })

  it('keeps the canvas when it cannot be transferred, and fails when posting throws', () => {
    const pool = backend()
    const l = listener()
    const lease = pool.acquire(l)
    FakeWorker.instances[0]!.reply({ type: 'ready', available: true })
    const stuck = { transferControlToOffscreen: () => { throw new Error('in use') } } as unknown as HTMLCanvasElement
    expect(lease.attach(stuck, state)).toBe(false)
    FakeWorker.instances[0]!.throwOnPost = true
    expect(lease.attach(canvas(), state)).toBe(true)
    expect(l.fail).toHaveBeenCalledOnce()
  })

  it('reports stats, and nothing without a live worker', async () => {
    const pool = backend()
    expect(await pool.stats()).toBeUndefined()
    pool.acquire(listener())
    const pending = pool.stats()
    FakeWorker.instances[0]!.reply({ type: 'stats', stats: { surfaces: 1, frames: 9, frameMs: 2 } })
    expect(await pending).toEqual({ surfaces: 1, frames: 9, frameMs: 2 })
    const unanswered = pool.stats()
    FakeWorker.instances[0]!.reply({ type: 'fail' })
    expect(await unanswered).toEqual({ surfaces: 0, frames: 0, frameMs: 0 })
  })
})

describe('main-thread backend', () => {
  it('renders on the main thread with a lazily loaded renderer', async () => {
    const fake = fakeGpu()
    const pool = createMainThreadBackend(() => fake.gpu, () => 30)
    const l = listener()
    const lease = pool.acquire(l)
    expect(lease.attach(new fake.Canvas() as unknown as HTMLCanvasElement, state)).toBe(false)
    expect(await lease.ready).toBe(true)
    expect(lease.attach(new fake.Canvas() as unknown as HTMLCanvasElement, state)).toBe(true)
    lease.update(state)
    await vi.advanceTimersByTimeAsync(100)
    expect(l.frame).toHaveBeenCalled()
    expect(await pool.stats()).toMatchObject({ surfaces: 1 })
    lease.release()
    lease.release()
    lease.update(state)
    expect(await pool.stats()).toMatchObject({ surfaces: 0 })
    fake.device.error()
    expect(l.fail).not.toHaveBeenCalled()
  })

  it('moves surfaces to CSS when the renderer fails', async () => {
    const fake = fakeGpu()
    const pool = createMainThreadBackend(() => fake.gpu, () => 30)
    const l = listener()
    const lease = pool.acquire(l)
    await lease.ready
    fake.device.error()
    expect(l.fail).toHaveBeenCalledOnce()
    expect(lease.attach(new fake.Canvas() as unknown as HTMLCanvasElement, state)).toBe(false)
  })

  it('reports not ready without WebGPU, and retries on the next lease', async () => {
    const pool = createMainThreadBackend(() => undefined, () => 30)
    expect(await pool.acquire(listener()).ready).toBe(false)
    expect(await pool.stats()).toBeUndefined()
    const released = pool.acquire(listener())
    released.release()
    expect(await released.ready).toBe(false)
  })
})
