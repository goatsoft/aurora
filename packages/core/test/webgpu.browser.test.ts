import { describe, expect, it } from 'vitest'

// Guards the browser test harness itself: later phases rely on a real adapter here.
describe('WebGPU in the browser test runner', () => {
  it('exposes navigator.gpu', () => {
    expect('gpu' in navigator).toBe(true)
  })

  it('acquires an adapter and device, and runs a compute pass', async () => {
    const adapter = await navigator.gpu.requestAdapter()
    expect(adapter).not.toBeNull()
    const device = await adapter!.requestDevice()

    const module = device.createShaderModule({
      code: /* wgsl */ `
        @group(0) @binding(0) var<storage, read_write> out: array<u32>;
        @compute @workgroup_size(1) fn main() { out[0] = 42u; }
      `,
    })
    const pipeline = device.createComputePipeline({ layout: 'auto', compute: { module } })
    const storage = device.createBuffer({ size: 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC })
    const readback = device.createBuffer({ size: 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: storage } }],
    })

    const encoder = device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(1)
    pass.end()
    encoder.copyBufferToBuffer(storage, 0, readback, 0, 4)
    device.queue.submit([encoder.finish()])

    await readback.mapAsync(GPUMapMode.READ)
    expect(new Uint32Array(readback.getMappedRange())[0]).toBe(42)
    readback.unmap()
    device.destroy()
  })
})
