import type { WorkerRequest, WorkerResponse } from '@/protocol'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generatorSpec } from '@/generators/define'
import { auroraFbm } from '@/generators/index'

// The worker's Renderer, held at its probe until the test lets it finish.
const renderer = vi.hoisted(() => ({ register: vi.fn(), attach: vi.fn(), finish: () => {} }))
vi.mock('@/renderer', () => ({
  Renderer: {
    create: () => new Promise((resolve) => {
      renderer.finish = () => {
        resolve(renderer)
      }
    }),
  },
}))

const posted: WorkerResponse[] = []
const scope = { postMessage: (message: WorkerResponse) => posted.push(message), onmessage: undefined as ((event: { data: WorkerRequest }) => void) | undefined }
vi.stubGlobal('self', scope)
vi.stubGlobal('OffscreenCanvas', class { getContext() { return {} } })
const send = (data: WorkerRequest) => {
  scope.onmessage!({ data })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the worker', () => {
  it('keeps generators registered while its probe is still running', async () => {
    await import('@/worker')
    const spec = generatorSpec(auroraFbm)
    // The page registers as soon as a surface updates, which is usually before the probe answers.
    send({ type: 'probe', fps: 30 })
    send({ type: 'register', generator: spec })
    expect(renderer.register).not.toHaveBeenCalled()
    renderer.finish()
    await vi.waitFor(() => {
      expect(posted).toContainEqual({ type: 'ready', available: true })
    })
    expect(renderer.register).toHaveBeenCalledWith(spec)
    send({ type: 'register', generator: spec })
    expect(renderer.register).toHaveBeenCalledTimes(2)
  })
})
