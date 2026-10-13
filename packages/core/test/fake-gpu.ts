/** A scriptable WebGPU stand-in for lifecycle tests in Node. */
export function fakeGpu() {
  const log = {
    devices: 0,
    submits: 0,
    passes: 0,
    configures: [] as string[],
    unconfigures: 0,
    buffers: 0,
    destroyedBuffers: 0,
    pipelines: 0,
    writes: [] as Float32Array[],
  }
  const pendingWork: (() => void)[] = []
  const pendingPipelines: (() => void)[] = []
  let autoPipelines = true
  let autoWork = true
  let adapterAvailable = true
  let current: ReturnType<typeof makeDevice> | undefined

  function makeDevice() {
    let lose!: (info: { reason: string, message: string }) => void
    const errorListeners: (() => void)[] = []
    const device = {
      lost: new Promise<{ reason: string, message: string }>((resolve) => {
        lose = resolve
      }),
      destroyed: false,
      destroy() {
        device.destroyed = true
        lose({ reason: 'destroyed', message: '' })
      },
      addEventListener(_: string, listener: () => void) {
        errorListeners.push(listener)
      },
      createBindGroupLayout: () => ({}),
      createPipelineLayout: () => ({}),
      createShaderModule: () => ({}),
      createRenderPipelineAsync: () => {
        log.pipelines++
        return new Promise((resolve) => {
          const done = () => resolve({})
          if (autoPipelines) queueMicrotask(done)
          else pendingPipelines.push(done)
        })
      },
      createBuffer: ({ size }: { size: number }) => {
        log.buffers++
        return { size, destroy: () => { log.destroyedBuffers++ } }
      },
      createBindGroup: () => ({}),
      createCommandEncoder: () => ({
        beginRenderPass: () => ({ setPipeline() {}, setBindGroup() {}, draw: () => { log.passes++ }, end() {} }),
        finish: () => ({}),
      }),
      queue: {
        writeBuffer: (_: unknown, __: number, data: Float32Array) => { log.writes.push(data.slice()) },
        submit: () => { log.submits++ },
        onSubmittedWorkDone: () => new Promise<void>((resolve) => {
          if (autoWork) queueMicrotask(resolve)
          else pendingWork.push(resolve)
        }),
      },
      lose: (reason = 'unknown') => lose({ reason, message: 'lost' }),
      error: () => { for (const listener of errorListeners) listener() },
    }
    return device
  }

  const gpu = {
    requestAdapter: async () => adapterAvailable
      ? {
          requestDevice: async () => {
            log.devices++
            current = makeDevice()
            return current
          },
        }
      : null,
    getPreferredCanvasFormat: () => 'bgra8unorm',
  }

  class Canvas {
    width = 300
    height = 150
    getContext() {
      return {
        configure: ({ colorSpace }: { colorSpace: string }) => { log.configures.push(colorSpace) },
        unconfigure: () => { log.unconfigures++ },
        getCurrentTexture: () => ({ createView: () => ({}) }),
      }
    }
  }

  return {
    gpu: gpu as unknown as GPU,
    log,
    Canvas,
    get device() {
      return current!
    },
    holdWork() {
      autoWork = false
    },
    finishWork() {
      for (const resolve of pendingWork.splice(0)) resolve()
    },
    holdPipelines() {
      autoPipelines = false
    },
    finishPipelines() {
      for (const resolve of pendingPipelines.splice(0)) resolve()
    },
    noAdapter() {
      adapterAvailable = false
    },
  }
}

export function installGpuGlobals(): void {
  Object.assign(globalThis, {
    GPUBufferUsage: { UNIFORM: 64, COPY_DST: 8 },
    GPUShaderStage: { FRAGMENT: 2 },
  })
}
