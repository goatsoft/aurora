import { ScrubField } from '@goatsoft/aurora-editor-ui'
import { contrastRatio, parseColor, rgbToOklab } from '@goatsoft/color'
import { mount } from '@vue/test-utils'
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

  it('keeps a default value readable above a fully filled slider', () => {
    const wrapper = mount(ScrubField, { props: { modelValue: 1, label: 'Opacity', min: 0, max: 1, step: 0.01, default: 1 }, attachTo: document.body })
    try {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      const context = canvas.getContext('2d')!
      context.fillStyle = '#fff'
      context.fillRect(0, 0, 1, 1)
      const control = wrapper.get('[role="slider"]').element
      for (const paint of [getComputedStyle(document.documentElement).getPropertyValue('--panel'), getComputedStyle(control).backgroundColor, getComputedStyle(control.children[0]!).backgroundColor]) {
        context.fillStyle = paint
        context.fillRect(0, 0, 1, 1)
      }
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data
      const background = rgbToOklab({ r: r! / 255, g: g! / 255, b: b! / 255, alpha: 1 })
      context.fillStyle = getComputedStyle(wrapper.get('span').element).color
      context.fillRect(0, 0, 1, 1)
      const [inkR, inkG, inkB] = context.getImageData(0, 0, 1, 1).data
      const ink = rgbToOklab({ r: inkR! / 255, g: inkG! / 255, b: inkB! / 255, alpha: 1 })
      expect(contrastRatio(ink, background)).toBeGreaterThanOrEqual(4.5)
    } finally { wrapper.unmount() }
  })
})
