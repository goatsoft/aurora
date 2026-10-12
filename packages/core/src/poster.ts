import type { AuroraDocument } from '@goatsoft/aurora-format'
import { loadGenerators } from './generators/index'
import { compose } from './shader'
import { packUniforms } from './uniforms'

export interface FrameOptions {
  width: number
  height: number
  /** Seconds into the animation (before the document's speed is applied). */
  time?: number
  /** A device to render with; one is requested (and released) if omitted. */
  device?: GPUDevice
}

/**
 * Renders one frame of a document to RGBA8 pixels with straight (not premultiplied) alpha:
 * the exact WebGPU output, for posters, thumbnails and comparisons. Rejects without WebGPU.
 */
export async function renderFrame(doc: AuroraDocument, { width, height, time = 0, device }: FrameOptions): Promise<Uint8ClampedArray<ArrayBuffer>> {
  await loadGenerators(doc.layers.map((layer) => layer.type))
  const gpu = device ?? await (await navigator.gpu.requestAdapter())?.requestDevice()
  if (!gpu) throw new Error('renderFrame needs WebGPU, and this browser has no WebGPU adapter.')
  try {
    const shader = compose(doc)
    const module = gpu.createShaderModule({ code: shader.code })
    const format = 'rgba8unorm'
    const pipeline = await gpu.createRenderPipelineAsync({
      layout: 'auto',
      vertex: { module, entryPoint: 'vs' },
      fragment: { module, entryPoint: 'fs', targets: [{ format }] },
    })
    const uniforms = packUniforms(doc, shader, { width, height, time, scroll: 0 })
    const buffer = gpu.createBuffer({ size: uniforms.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
    gpu.queue.writeBuffer(buffer, 0, uniforms)
    const texture = gpu.createTexture({ size: [width, height], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC })
    const bytesPerRow = Math.ceil((width * 4) / 256) * 256
    const read = gpu.createBuffer({ size: bytesPerRow * height, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
    const encoder = gpu.createCommandEncoder()
    const pass = encoder.beginRenderPass({ colorAttachments: [{ view: texture.createView(), clearValue: [0, 0, 0, 0], loadOp: 'clear', storeOp: 'store' }] })
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, gpu.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer } }] }))
    pass.draw(3)
    pass.end()
    encoder.copyTextureToBuffer({ texture }, { buffer: read, bytesPerRow }, [width, height])
    gpu.queue.submit([encoder.finish()])
    await read.mapAsync(GPUMapMode.READ)
    const padded = new Uint8Array(read.getMappedRange())
    const out = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width * 4; x += 4) {
        const i = y * bytesPerRow + x
        const o = y * width * 4 + x
        const a = padded[i + 3]!
        // The compositor works in premultiplied alpha; images want it straight.
        const k = a ? 255 / a : 0
        out[o] = padded[i]! * k
        out[o + 1] = padded[i + 1]! * k
        out[o + 2] = padded[i + 2]! * k
        out[o + 3] = a
      }
    }
    read.unmap()
    for (const resource of [read, buffer, texture]) resource.destroy()
    return out
  } finally {
    if (!device) gpu.destroy()
  }
}

/** One frame as a PNG, for `og:image` and posters. */
export async function renderPoster(doc: AuroraDocument, options: FrameOptions): Promise<Blob> {
  const pixels = await renderFrame(doc, options)
  const canvas = new OffscreenCanvas(options.width, options.height)
  canvas.getContext('2d')!.putImageData(new ImageData(pixels, options.width, options.height), 0, 0)
  return canvas.convertToBlob({ type: 'image/png' })
}
