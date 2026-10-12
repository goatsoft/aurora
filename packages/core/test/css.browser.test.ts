import { assertAurora } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { DRIFT_KEYFRAMES, compileCss } from '../src/css'

const presets = import.meta.glob<string>('../../../presets/goat/*.aurora', { query: '?raw', import: 'default', eager: true })

describe('CSS fallback in a real browser', () => {
  it.each(Object.entries(presets))('%s is valid CSS that the browser accepts', (_, text) => {
    const css = compileCss(assertAurora(text))
    const el = document.createElement('div')
    el.style.cssText = css.style
    expect(el.style.backgroundImage).not.toBe('')
    expect(el.style.backgroundImage).toContain('oklch(')
    if (css.maskImage) expect(el.style.maskImage || el.style.getPropertyValue('-webkit-mask-image')).not.toBe('')
  })

  it('parses the drift keyframes', () => {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(DRIFT_KEYFRAMES)
    expect(sheet.cssRules[0]).toBeInstanceOf(CSSKeyframesRule)
  })
})
