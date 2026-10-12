/** Test helper: renders a fullscreen shader into an rgba8unorm texture and reads the pixels back. */
export async function device(): Promise<GPUDevice> {
  const adapter = await navigator.gpu.requestAdapter()
  return adapter!.requestDevice()
}

export async function render(gpu: GPUDevice, code: string, uniforms: Float32Array<ArrayBuffer>, width: number, height: number): Promise<Uint8Array> {
  const module = gpu.createShaderModule({ code })
  const errors = (await module.getCompilationInfo()).messages.filter((m) => m.type === 'error')
  if (errors.length) throw new Error(errors.map((e) => `${e.lineNum}:${e.linePos} ${e.message}`).join('\n'))
  const format = 'rgba8unorm'
  const pipeline = await gpu.createRenderPipelineAsync({
    layout: 'auto',
    vertex: { module, entryPoint: 'vs' },
    fragment: { module, entryPoint: 'fs', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  })
  const buffer = gpu.createBuffer({ size: uniforms.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  gpu.queue.writeBuffer(buffer, 0, uniforms)
  const texture = gpu.createTexture({ size: [width, height], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC })
  const bytesPerRow = Math.ceil((width * 4) / 256) * 256
  const read = gpu.createBuffer({ size: bytesPerRow * height, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
  const encoder = gpu.createCommandEncoder()
  const pass = encoder.beginRenderPass({
    colorAttachments: [{ view: texture.createView(), clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: 'clear', storeOp: 'store' }],
  })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, gpu.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer } }] }))
  pass.draw(3)
  pass.end()
  encoder.copyTextureToBuffer({ texture }, { buffer: read, bytesPerRow }, [width, height])
  gpu.queue.submit([encoder.finish()])
  await read.mapAsync(GPUMapMode.READ)
  const padded = new Uint8Array(read.getMappedRange())
  const pixels = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) pixels.set(padded.subarray(y * bytesPerRow, y * bytesPerRow + width * 4), y * width * 4)
  read.unmap()
  buffer.destroy()
  texture.destroy()
  return pixels
}

export interface Diff {
  /** Fraction of pixels where any channel differs at all. */
  changed: number
  /** Largest per-channel difference, 0–255. */
  max: number
  /** Fraction of pixels with any visible ink, to show the comparison isn't of two empty images. */
  coverage: number
}

export function diff(a: Uint8Array, b: Uint8Array): Diff {
  let changed = 0
  let max = 0
  let ink = 0
  for (let i = 0; i < a.length; i += 4) {
    let pixel = 0
    for (let k = 0; k < 4; k++) pixel = Math.max(pixel, Math.abs(a[i + k]! - b[i + k]!))
    if (pixel) changed++
    if (a[i + 3]! > 2) ink++
    max = Math.max(max, pixel)
  }
  const n = a.length / 4
  return { changed: changed / n, max, coverage: ink / n }
}
