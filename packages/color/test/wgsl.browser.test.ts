import type { Oklab } from '@/index'
import { describe, expect, it } from 'vitest'
import { COLOR_WGSL, oklabToRgb, rgbToOklab, srgbToLinear } from '@/index'

/** Runs `expr(input)` for each input vec3 on the GPU and returns the results. */
async function run(expr: string, inputs: readonly (readonly [number, number, number])[]) {
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter!.requestDevice()
  const code = `${COLOR_WGSL}
    @group(0) @binding(0) var<storage, read> input: array<vec4f>;
    @group(0) @binding(1) var<storage, read_write> output: array<vec4f>;
    @compute @workgroup_size(1) fn main(@builtin(global_invocation_id) id: vec3u) {
      output[id.x] = vec4f(${expr}(input[id.x].xyz), 0.0);
    }`
  const module = device.createShaderModule({ code })
  const info = await module.getCompilationInfo()
  expect(info.messages.filter((m) => m.type === 'error')).toEqual([])
  const pipeline = device.createComputePipeline({ layout: 'auto', compute: { module } })
  const size = inputs.length * 16
  const input = device.createBuffer({ size, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
  const output = device.createBuffer({ size, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC })
  const read = device.createBuffer({ size, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
  device.queue.writeBuffer(input, 0, new Float32Array(inputs.flatMap((v) => [...v, 0])))
  const encoder = device.createCommandEncoder()
  const pass = encoder.beginComputePass()
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: input } }, { binding: 1, resource: { buffer: output } }],
  }))
  pass.dispatchWorkgroups(inputs.length)
  pass.end()
  encoder.copyBufferToBuffer(output, 0, read, 0, size)
  device.queue.submit([encoder.finish()])
  await read.mapAsync(GPUMapMode.READ)
  const data = new Float32Array(read.getMappedRange().slice(0))
  device.destroy()
  return inputs.map((_, i) => [data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!])
}

const samples: Oklab[] = [
  { l: 0.68, a: -0.04, b: -0.15, alpha: 1 },
  { l: 0.56, a: 0.06, b: -0.21, alpha: 1 },
  { l: 0.9, a: 0.02, b: 0.05, alpha: 1 },
  { l: 0.3, a: -0.08, b: 0.06, alpha: 1 },
]

describe('COLOR_WGSL on the GPU matches the TypeScript maths', () => {
  it('converts OKLab to linear sRGB and Display P3', async () => {
    const labs = samples.map((s) => [s.l, s.a, s.b] as const)
    for (const [fn, space] of [['color_oklab_to_linear_srgb', 'srgb'], ['color_oklab_to_linear_p3', 'display-p3']] as const) {
      const gpu = await run(fn, labs)
      samples.forEach((lab, i) => {
        const rgb = oklabToRgb(lab, space)
        const expected = [rgb.r, rgb.g, rgb.b].map(srgbToLinear)
        expect(gpu[i]).toEqual(expected.map((v): unknown => expect.closeTo(v, 4)))
      })
    }
  })

  it('round-trips the sRGB transfer function', async () => {
    const values = [[0, 0.02, 0.5], [0.04045, 0.7, 1]] as const
    const gpu = await run('color_srgb_encode', (await run('color_srgb_decode', values)).map((v) => [v[0]!, v[1]!, v[2]!] as const))
    for (const [i, row] of gpu.entries()) {
      for (const [k, x] of row.entries()) expect(x).toBeCloseTo(values[i]![k]!, 5)
    }
  })

  it('maps sRGB primaries into Display P3', async () => {
    const [p3] = await run('color_linear_srgb_to_linear_p3', [[1, 0, 0]])
    const expected = oklabToRgb(rgbToOklab({ r: 1, g: 0, b: 0, alpha: 1 }), 'display-p3')
    expect(p3).toEqual([expected.r, expected.g, expected.b].map((v): unknown => expect.closeTo(srgbToLinear(v), 4)))
  })
})
