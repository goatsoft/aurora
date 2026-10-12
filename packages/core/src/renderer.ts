import { compose } from './compose'
import type { ComposedShader } from './compose'
import type { RendererStats, SurfaceState } from './protocol'
import { packUniforms } from './uniforms'

type Canvas = OffscreenCanvas | HTMLCanvasElement

interface Surface {
  canvas: Canvas
  state: SurfaceState
  context?: GPUCanvasContext
  configured?: string
  buffer?: GPUBuffer
  bind?: GPUBindGroup
  uniforms?: Float32Array<ArrayBuffer>
  dirty: boolean
  shown: boolean
}

export interface RendererEvents {
  /** A surface rendered its first frame (again, after device recovery). Only now may it claim WebGPU. */
  frame: (id: number) => void
  /** The GPU is gone for good. Every surface must fall back to CSS. */
  fail: () => void
}

export interface RendererOptions {
  fps: number
  now?: () => number
  /** Device-loss recoveries to attempt before giving up. */
  recoveries?: number
}

const epochNow = () => performance.timeOrigin + performance.now()

/**
 * Draws every surface on one device with one pipeline per composed shader. Frames share a budget
 * (`fps`), go out as one command buffer, and the next batch is never queued before the GPU has
 * finished the last. Works with OffscreenCanvas in a worker or HTMLCanvasElement on the main thread.
 */
export class Renderer {
  readonly stats: RendererStats = { surfaces: 0, frames: 0, frameMs: 0 }
  private readonly surfaces = new Map<number, Surface>()
  private pipelines = new Map<string, GPURenderPipeline | Promise<void>>()
  private layout!: GPUPipelineLayout
  private group!: GPUBindGroupLayout
  private device!: GPUDevice
  private adapter: GPUAdapter | undefined
  private format!: GPUTextureFormat
  private timer: ReturnType<typeof setTimeout> | undefined
  private drawing = false
  private failed = false
  private recoveries: number
  private readonly now: () => number
  /** Why the renderer failed, for debugging. */
  error: unknown

  private constructor(private readonly gpu: GPU, private readonly events: RendererEvents, private readonly options: RendererOptions) {
    this.recoveries = options.recoveries ?? 1
    this.now = options.now ?? epochNow
  }

  /** Resolves once a device is ready; rejects when WebGPU is unusable here. */
  static async create(gpu: GPU | undefined, events: RendererEvents, options: RendererOptions): Promise<Renderer> {
    if (!gpu) throw new Error('WebGPU is not available.')
    const renderer = new Renderer(gpu, events, options)
    await renderer.init()
    return renderer
  }

  private async init(): Promise<void> {
    const adapter = await this.gpu.requestAdapter({ powerPreference: 'low-power' })
    if (!adapter) throw new Error('No WebGPU adapter.')
    const device = await adapter.requestDevice()
    // Chrome drops the WebGPU instance with the last adapter reference, so keep one.
    this.adapter = adapter
    this.device = device
    this.format = this.gpu.getPreferredCanvasFormat()
    this.group = device.createBindGroupLayout({ entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }] })
    this.layout = device.createPipelineLayout({ bindGroupLayouts: [this.group] })
    this.pipelines = new Map()
    void device.lost.then((info) => this.lost(device, info))
    device.addEventListener('uncapturederror', () => this.fail())
  }

  private async lost(device: GPUDevice, info: GPUDeviceLostInfo): Promise<void> {
    if (this.failed || device !== this.device || info.reason === 'destroyed') return
    if (this.recoveries-- <= 0) {
      this.fail()
      return
    }
    try {
      await this.init()
    } catch {
      this.fail()
      return
    }
    for (const surface of this.surfaces.values()) this.reset(surface)
    this.schedule()
  }

  private reset(surface: Surface): void {
    surface.buffer?.destroy()
    delete surface.buffer
    delete surface.bind
    delete surface.configured
    surface.dirty = true
    surface.shown = false
  }

  attach(id: number, canvas: Canvas, state: SurfaceState): void {
    if (this.failed) return
    this.surfaces.set(id, { canvas, state, dirty: true, shown: false })
    this.stats.surfaces = this.surfaces.size
    this.schedule()
  }

  update(id: number, state: SurfaceState): void {
    const surface = this.surfaces.get(id)
    if (!surface || this.failed) return
    surface.state = state
    surface.dirty = true
    this.schedule()
  }

  detach(id: number): void {
    const surface = this.surfaces.get(id)
    if (!surface) return
    this.release(surface)
    this.surfaces.delete(id)
    this.stats.surfaces = this.surfaces.size
  }

  /** Releases everything. Surfaces still attached get `fail`, so they show CSS. */
  fail(): void {
    if (this.failed) return
    this.failed = true
    clearTimeout(this.timer)
    this.timer = undefined
    for (const surface of this.surfaces.values()) this.release(surface)
    this.surfaces.clear()
    this.stats.surfaces = 0
    this.device.destroy()
    this.events.fail()
  }

  get isFailed(): boolean {
    return this.failed
  }

  private release(surface: Surface): void {
    try {
      surface.context?.unconfigure()
    } catch { /* Gone with the device. */ }
    surface.buffer?.destroy()
  }

  private needsFrame(surface: Surface): boolean {
    return surface.state.visible && (surface.state.reduced !== 'still' || surface.dirty)
  }

  private schedule(): void {
    if (this.failed || this.drawing || this.timer !== undefined) return
    if (![...this.surfaces.values()].some((s) => this.needsFrame(s))) return
    this.timer = setTimeout(() => {
      this.timer = undefined
      void this.draw()
    }, 1000 / this.options.fps)
  }

  /** The pipeline for a shader, or undefined while it compiles (the surface waits a frame). */
  private pipeline(shader: ComposedShader): GPURenderPipeline | undefined {
    const key = `${shader.key}#${this.format}`
    const existing = this.pipelines.get(key)
    if (existing instanceof Promise) return undefined
    if (existing) return existing
    const device = this.device
    const module = device.createShaderModule({ code: shader.code })
    const pending = device.createRenderPipelineAsync({
      layout: this.layout,
      vertex: { module, entryPoint: 'vs' },
      fragment: { module, entryPoint: 'fs', targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list' },
    }).then((pipeline) => {
      if (device !== this.device) return
      this.pipelines.set(key, pipeline)
      this.schedule()
    }, () => this.fail())
    this.pipelines.set(key, pending)
    return undefined
  }

  private async draw(): Promise<void> {
    if (this.failed) return
    this.drawing = true
    const started = performance.now()
    const device = this.device
    try {
      const encoder = device.createCommandEncoder()
      const rendered: number[] = []
      let drew = false
      for (const [id, surface] of this.surfaces) {
        if (!this.needsFrame(surface)) continue
        const { state, canvas } = surface
        const shader = compose(state.doc, state.output)
        const pipeline = this.pipeline(shader)
        if (!pipeline) continue
        if (canvas.width !== state.width) canvas.width = state.width
        if (canvas.height !== state.height) canvas.height = state.height
        if (!surface.context) {
          const created = (canvas as OffscreenCanvas).getContext('webgpu')
          if (!created) throw new Error('This canvas has no WebGPU context.')
          surface.context = created
        }
        const context = surface.context
        if (surface.configured !== state.output) {
          context.configure({ device, format: this.format, alphaMode: 'premultiplied', colorSpace: state.output })
          surface.configured = state.output
        }
        const size = shader.slots * 16
        if (surface.buffer?.size !== size) {
          surface.buffer?.destroy()
          surface.buffer = device.createBuffer({ size, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
          surface.bind = device.createBindGroup({ layout: this.group, entries: [{ binding: 0, resource: { buffer: surface.buffer } }] })
        }
        const seconds = state.reduced === 'still' ? 0 : ((this.now() - state.origin) / 1000) * (state.reduced === 'slow' ? 0.1 : 1)
        surface.uniforms = packUniforms(state.doc, shader, {
          width: state.scene.width,
          height: state.scene.height,
          time: seconds,
          scroll: state.scroll,
          rect: state.scene.rect,
        }, surface.uniforms)
        device.queue.writeBuffer(surface.buffer, 0, surface.uniforms)
        const pass = encoder.beginRenderPass({
          colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: 'clear', storeOp: 'store' }],
        })
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, surface.bind)
        pass.draw(3)
        pass.end()
        surface.dirty = false
        drew = true
        if (!surface.shown) rendered.push(id)
      }
      if (drew) {
        device.queue.submit([encoder.finish()])
        await device.queue.onSubmittedWorkDone()
        this.stats.frames++
        this.stats.frameMs = performance.now() - started
      }
      if (!this.isFailed && device === this.device) {
        for (const id of rendered) {
          const surface = this.surfaces.get(id)
          if (surface) {
            surface.shown = true
            this.events.frame(id)
          }
        }
      }
    } catch (error) {
      this.error = error
      this.fail()
    } finally {
      this.drawing = false
      this.schedule()
    }
  }
}
