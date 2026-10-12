/// <reference lib="webworker" />
import type { WorkerRequest, WorkerResponse } from './protocol'
import { Renderer } from './renderer'

/**
 * The page's one Aurora worker (ADR-0079): owns the device, pipelines and scheduling.
 * Canvases arrive as OffscreenCanvas only after `ready`, so a failed probe never strands one.
 */
const scope = self as unknown as DedicatedWorkerGlobalScope
const post = (message: WorkerResponse) => {
  scope.postMessage(message)
}

let renderer: Renderer | undefined
let failed = false

scope.onmessage = ({ data }: MessageEvent<WorkerRequest>) => {
  switch (data.type) {
    case 'probe':
      void Renderer.create(navigator.gpu, {
        frame: (id) => {
          post({ type: 'frame', id })
        },
        fail: () => {
          failed = true
          post({ type: 'fail' })
        },
      }, { fps: data.fps }).then((created) => {
        // A worker canvas must be able to get a context, or attaching would strand it.
        if (!new OffscreenCanvas(1, 1).getContext('webgpu')) throw new Error('No OffscreenCanvas WebGPU.')
        renderer = created
        post({ type: 'ready', available: true })
      }).catch(() => {
        failed = true
        post({ type: 'ready', available: false })
      })
      return
    case 'attach':
      if (failed || !renderer) post({ type: 'fail' })
      else renderer.attach(data.id, data.canvas, data.state)
      return
    case 'update':
      renderer?.update(data.id, data.state)
      return
    case 'detach':
      renderer?.detach(data.id)
      return
    case 'stats':
      post({ type: 'stats', stats: renderer?.stats ?? { surfaces: 0, frames: 0, frameMs: 0 } })
  }
}
