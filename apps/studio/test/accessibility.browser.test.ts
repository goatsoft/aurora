import { contrastRatio, parseColor, rgbToOklab } from '@goatsoft/color'
import { afterEach, describe, expect, it } from 'vitest'
import '@/main.css'

afterEach(() => document.documentElement.classList.remove('page-light'))

describe('Studio panel contrast', () => {
  it.each(['dark', 'light'])('keeps editing controls readable over the %s page and bright artwork', (page) => {
    document.documentElement.classList.toggle('page-light', page === 'light')
    const style = getComputedStyle(document.documentElement)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d')!
    for (const ground of ['#000', '#fff']) {
      context.fillStyle = ground
      context.fillRect(0, 0, 1, 1)
      context.fillStyle = style.getPropertyValue('--panel')
      context.fillRect(0, 0, 1, 1)
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data
      const background = rgbToOklab({ r: r! / 255, g: g! / 255, b: b! / 255, alpha: 1 })
      for (const token of ['--foreground', '--muted-foreground', '--primary', '--ring']) {
        const parsed = parseColor(style.getPropertyValue(token))
        if (!parsed.ok) throw new Error(parsed.message)
        expect(contrastRatio(parsed.color, background), `${token} over ${ground}`).toBeGreaterThanOrEqual(token === '--ring' ? 3 : 4.5)
      }
    }
  })
})
