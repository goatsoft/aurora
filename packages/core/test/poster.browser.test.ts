import { assertAurora } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { renderFrame, renderPoster } from '@/poster'
import { compose } from '@/shader'
import { packUniforms } from '@/uniforms'
import hero from '~/presets/classic/hero.aurora?raw'
import { device, render } from './gpu'

const doc = assertAurora(hero)

describe('renderFrame', () => {
  it('returns exactly what the GPU draws, with alpha un-premultiplied', async () => {
    const gpu = await device()
    const shader = compose(doc)
    const premultiplied = await render(gpu, shader.code, packUniforms(doc, shader, { width: 64, height: 36, time: 2, scroll: 0 }), 64, 36)
    const straight = await renderFrame(doc, { width: 64, height: 36, time: 2, device: gpu })
    expect(straight).toHaveLength(64 * 36 * 4)
    let worst = 0
    for (let i = 0; i < premultiplied.length; i += 4) {
      const a = premultiplied[i + 3]!
      expect(straight[i + 3]).toBe(a)
      for (let k = 0; k < 3; k++) if (a > 8) worst = Math.max(worst, Math.abs(Math.round((straight[i + k]! * a) / 255) - premultiplied[i + k]!))
    }
    expect(worst).toBeLessThanOrEqual(1)
    expect(premultiplied.some((v) => v > 0)).toBe(true)
    gpu.destroy()
  })
})

describe('renderPoster', () => {
  it('encodes the frame as a PNG of the requested size', async () => {
    const png = await renderPoster(doc, { width: 120, height: 60, time: 1 })
    expect(png.type).toBe('image/png')
    const bitmap = await createImageBitmap(png)
    expect([bitmap.width, bitmap.height]).toEqual([120, 60])
  })
})
