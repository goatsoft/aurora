import { assertAurora } from '@goatsoft/aurora-format'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { compose } from '@/compose'
import { GENERATORS } from '@/generators/index'
import { packUniforms } from '@/uniforms'
import { expectGolden } from './golden'
import { device, render } from './gpu'

/** Every built-in generator, with its own defaults and palette: what a designer sees first. */
const W = 384
const H = 216
const TIME = 6.5

let gpu: GPUDevice
beforeAll(async () => {
  gpu = await device()
})
afterAll(() => {
  gpu.destroy()
})

describe('generator golden images', () => {
  it.each(Object.values(GENERATORS).filter((g) => !g.id.startsWith('test-')).map((g) => [g.id, g] as const))('%s', async (id, generator) => {
    const doc = assertAurora({ format: 'aurora', version: 1, name: id, palette: [...generator.palette], layers: [{ type: id }] })
    const shader = compose(doc)
    const pixels = await render(gpu, shader.code, packUniforms(doc, shader, { width: W, height: H, time: TIME, scroll: 0 }), W, H)
    // Composite onto the dark page the presets are designed for, so the PNG shows what a visitor sees.
    for (let i = 0; i < pixels.length; i += 4) {
      const a = pixels[i + 3]! / 255
      for (let k = 0; k < 3; k++) pixels[i + k] = Math.round(pixels[i + k]! + 8 * (1 - a))
      pixels[i + 3] = 255
    }
    await expectGolden(id, pixels, W, H)
  })
})
