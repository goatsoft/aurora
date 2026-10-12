import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { noiseWgsl } from '@/generators/noise'
import type { NoiseModule } from '@/generators/noise'
import { device } from './gpu'

let gpu: GPUDevice
beforeAll(async () => {
  gpu = await device()
})
afterAll(() => {
  gpu.destroy()
})

const N = 64 * 64

/** Evaluates `expr` (WGSL, in terms of `p: vec2f`) on a 64×64 grid spanning [-40, 40]², returning vec4 rows. */
async function sample(modules: NoiseModule[], expr: string): Promise<Float32Array> {
  const code = `${noiseWgsl(modules)}
    @group(0) @binding(0) var<storage, read_write> out: array<vec4f>;
    @compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id: vec3u) {
      let p = (vec2f(f32(id.x % 64u), f32(id.x / 64u)) / 63.0 - 0.5) * 80.0 + 0.123;
      out[id.x] = vec4f(${expr});
    }`
  const module = gpu.createShaderModule({ code })
  const errors = (await module.getCompilationInfo()).messages.filter((m) => m.type === 'error')
  expect(errors.map((e) => `${e.lineNum}: ${e.message}`)).toEqual([])
  const pipeline = gpu.createComputePipeline({ layout: 'auto', compute: { module } })
  const size = N * 16
  const out = gpu.createBuffer({ size, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC })
  const read = gpu.createBuffer({ size, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
  const encoder = gpu.createCommandEncoder()
  const pass = encoder.beginComputePass()
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, gpu.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: out } }] }))
  pass.dispatchWorkgroups(N / 64)
  pass.end()
  encoder.copyBufferToBuffer(out, 0, read, 0, size)
  gpu.queue.submit([encoder.finish()])
  await read.mapAsync(GPUMapMode.READ)
  const data = new Float32Array(read.getMappedRange().slice(0))
  read.unmap()
  return data
}

const column = (data: Float32Array, k: number) => Array.from({ length: N }, (_, i) => data[i * 4 + k]!)
const stats = (values: number[]) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return { min: Math.min(...values), max: Math.max(...values), mean, finite: values.every(Number.isFinite) }
}

describe('noise library on the GPU', () => {
  it.each([
    ['hash', 'noise_hash21(p * 7.0), noise_hash22(p * 7.0), 0.0', [0, 1], [0.4, 0.6]],
    ['value', 'noise_value(p), 0.0, 0.0, 0.0', [0, 1], [0.35, 0.65]],
    ['perlin', 'noise_perlin(p), 0.0, 0.0, 0.0', [-1.05, 1.05], [-0.1, 0.1]],
    ['simplex', 'noise_simplex(p), 0.0, 0.0, 0.0', [-1.05, 1.05], [-0.1, 0.1]],
    ['fbm', 'noise_fbm(p * 0.3, 5), noise_ridged(p * 0.3, 5), noise_turbulence(p * 0.3, 5), 0.0', [-1.05, 1.05], [-0.15, 0.15]],
  ] as const)('%s stays in range, is centred and never NaN', async (module, expr, [lo, hi], [meanLo, meanHi]) => {
    const values = column(await sample([module], expr), 0)
    const s = stats(values)
    expect(s.finite).toBe(true)
    expect(s.min).toBeGreaterThanOrEqual(lo)
    expect(s.max).toBeLessThanOrEqual(hi)
    expect(s.mean).toBeGreaterThan(meanLo)
    expect(s.mean).toBeLessThan(meanHi)
    // Not degenerate: it actually varies.
    expect(s.max - s.min).toBeGreaterThan((hi - lo) * 0.4)
  })

  it('hashes to exact multiples of 2⁻²⁴, so it never rounds up to 1', async () => {
    const data = await sample(['hash'], 'noise_hash22(p * 1e5), noise_hash22(p * 1e5 + 0.5)')
    const values = Array.from(data)
    expect(values.every((v) => v >= 0 && v < 1 && Number.isInteger(v * 16777216))).toBe(true)
  })

  it('makes ridged and turbulent fbm non-negative', async () => {
    const data = await sample(['fbm'], 'noise_fbm(p * 0.3, 5), noise_ridged(p * 0.3, 5), noise_turbulence(p * 0.3, 5), 0.0')
    for (const k of [1, 2]) {
      const s = stats(column(data, k))
      expect(s.min).toBeGreaterThanOrEqual(0)
      expect(s.max).toBeLessThanOrEqual(1)
    }
  })

  it('orders cellular distances F1 ≤ F2', async () => {
    const data = await sample(['worley'], 'noise_worley(p), 0.0, 0.0')
    const f1 = column(data, 0)
    const f2 = column(data, 1)
    expect(f1.every((d, i) => d >= 0 && d <= f2[i]! + 1e-6)).toBe(true)
    expect(stats(f1).max).toBeLessThan(1.5)
  })

  it('gives curl noise (almost) zero divergence', async () => {
    const e = 0.01
    const data = await sample(['curl'], `(noise_curl(p * 0.2 + vec2f(${e}, 0.0)).x - noise_curl(p * 0.2 - vec2f(${e}, 0.0)).x + noise_curl(p * 0.2 + vec2f(0.0, ${e})).y - noise_curl(p * 0.2 - vec2f(0.0, ${e})).y) / ${2 * e}, length(noise_curl(p * 0.2)), 0.0, 0.0`)
    const divergence = stats(column(data, 0).map(Math.abs))
    const magnitude = stats(column(data, 1))
    expect(divergence.mean / magnitude.mean).toBeLessThan(0.1)
  })

  it('is deterministic', async () => {
    const a = await sample(['simplex', 'worley'], 'noise_simplex(p), noise_worley(p), 0.0')
    const b = await sample(['simplex', 'worley'], 'noise_simplex(p), noise_worley(p), 0.0')
    expect(a).toEqual(b)
  })
})
