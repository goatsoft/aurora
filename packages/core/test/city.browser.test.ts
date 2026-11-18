import type { AuroraDocument } from '@goatsoft/aurora-format'
import { assertAurora } from '@goatsoft/aurora-format'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { compose as composeSpecs } from '@/compose'
import { generatorSpec } from '@/generators/define'
import { GENERATORS, loadGenerators } from '@/generators/index'
import { compose } from '@/shader'
import { packUniforms } from '@/uniforms'
import { expectGolden } from './golden'
import { device, diff, render } from './gpu'

const IDS = ['skyline', 'transit', 'city-lights', 'harbor', 'fog'] as const
await loadGenerators(IDS)
let gpu: GPUDevice
beforeAll(async () => { gpu = await device() })
afterAll(() => { gpu.destroy() })

function document(id: string, params: Record<string, number> = {}, speed = 1) {
  return assertAurora({ format: 'aurora', version: 1, name: id, palette: [...GENERATORS[id]!.palette], motion: { speed }, layers: [{ type: id, params }] })
}

async function frame(doc: AuroraDocument, time: number, width = 384, height = 216) {
  const shader = compose(doc)
  return render(gpu, shader.code, packUniforms(doc, shader, { width, height, time, scroll: 0 }), width, height)
}

describe.each(IDS)('%s on WebGPU', (id) => {
  it('renders deterministic, non-uniform frames and changes over time', async () => {
    const doc = document(id, id === 'skyline' ? { speed: 0.5 } : {})
    const a = await frame(doc, 0)
    const b = await frame(doc, 1.5)
    expect(diff(a, await frame(doc, 0)).changed).toBe(0)
    expect(diff(a, b).changed).toBeGreaterThan(0.005)
    const colors = new Set(Array.from({ length: a.length / 4 }, (_, i) => `${a[i * 4]},${a[i * 4 + 1]},${a[i * 4 + 2]}`))
    expect(colors.size).toBeGreaterThan(12)
  })

  it('keeps its authored still frame when document motion is stopped', async () => {
    const doc = document(id, {}, 0)
    expect(diff(await frame(doc, 0), await frame(doc, 8)).changed).toBe(0)
  })

  it('changes the arrangement through its seed control', async () => {
    expect(diff(await frame(document(id), 0), await frame(document(id, { seed: 19 }), 0)).changed).toBeGreaterThan(0.02)
  })

  it('renders the structured-cloned spec used by workers identically', async () => {
    const spec = structuredClone(generatorSpec(GENERATORS[id]!))
    spec.id = `test-worker-${id}`
    const doc = document(id)
    const transferred = assertAurora({ ...doc, layers: [{ ...doc.layers[0]!, type: spec.id }] })
    const shader = composeSpecs(transferred, 'srgb', () => spec)
    const actual = await render(gpu, shader.code, packUniforms(transferred, shader, { width: 384, height: 216, time: 0.25, scroll: 0 }), 384, 216)
    expect(diff(actual, await frame(doc, 0.25)).changed).toBe(0)
  })

  it.each(['min', 'max'] as const)('renders all parameter %s values on a tiny canvas', async (bound) => {
    const params = Object.fromEntries(Object.entries(GENERATORS[id]!.params).map(([name, spec]) => [name, spec[bound]]))
    const pixels = await frame(document(id, params), 0.25, 32, 18)
    expect(pixels).toHaveLength(32 * 18 * 4)
    const alpha = Array.from(pixels).filter((_, i) => i % 4 === 3)
    expect(Math.min(...alpha)).toBe(0)
    if (bound === 'max') expect(Math.max(...alpha)).toBeGreaterThan(0)
  })

  it('has reviewed motion across desktop, portrait and ultrawide frames', async () => {
    const sizes = [[384, 216], [144, 256], [512, 144]] as const
    const sheetWidth = 1536
    const sheetHeight = 616
    const sheet = new Uint8Array(sheetWidth * sheetHeight * 4)
    for (let i = 3; i < sheet.length; i += 4) sheet[i] = 255
    let top = 0
    for (const [width, height] of sizes) {
      for (const [index, time] of [0, 0.5, 6.5].entries()) {
        const pixels = await frame(document(id), time, width, height)
        for (let i = 0; i < pixels.length; i += 4) {
          const a = pixels[i + 3]! / 255
          for (let k = 0; k < 3; k++) pixels[i + k] = Math.round(pixels[i + k]! + 8 * (1 - a))
          pixels[i + 3] = 255
        }
        const left = index * 512
        for (let y = 0; y < height; y++) sheet.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), ((top + y) * sheetWidth + left) * 4)
      }
      top += height
    }
    await expectGolden(`city-${id}-motion`, sheet, sheetWidth, sheetHeight)
  })
})
