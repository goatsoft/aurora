import type { SurfaceState, WorkerRequest, WorkerResponse } from '@/protocol'
import { assertAurora } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { generatorSpec } from '@/generators/define'
import { GENERATORS, loadGenerators } from '@/generators/index'
import AuroraWorker from '@/worker?worker'

const doc = assertAurora({ format: 'aurora', version: 1, name: 'Worker test', palette: ['oklch(0.95 0.02 250)'], layers: [{ type: 'starfield' }] })

function state(): SurfaceState {
  return { doc, width: 64, height: 64, scene: { width: 64, height: 64, rect: [0, 0, 1, 1] }, scroll: 0, visible: true, reduced: false, origin: Date.now(), output: 'srgb' }
}

describe('the worker', () => {
  it('keeps generators registered before its probe finishes', async () => {
    await loadGenerators(['starfield'])
    const worker = new AuroraWorker()
    const replies: WorkerResponse[] = []
    const reply = (type: WorkerResponse['type']) => new Promise<WorkerResponse>((resolve) => {
      worker.addEventListener('message', ({ data }: MessageEvent<WorkerResponse>) => {
        if (data.type === type || data.type === 'fail') resolve(data)
      })
    })
    worker.addEventListener('message', ({ data }: MessageEvent<WorkerResponse>) => replies.push(data))
    const send = (message: WorkerRequest, transfer: Transferable[] = []) => {
      worker.postMessage(message, transfer)
    }
    try {
      const ready = reply('ready')
      // The page registers as soon as a surface updates, which is usually before the probe answers.
      send({ type: 'probe', fps: 60 })
      send({ type: 'register', generator: generatorSpec(GENERATORS['starfield']!) })
      expect(await ready).toEqual({ type: 'ready', available: true })
      const frame = reply('frame')
      const canvas = new OffscreenCanvas(64, 64)
      send({ type: 'attach', id: 1, canvas, state: state() }, [canvas])
      expect(await frame).toEqual({ type: 'frame', id: 1 })
      expect(replies).not.toContainEqual({ type: 'fail' })
    } finally {
      worker.terminate()
    }
  })
})
