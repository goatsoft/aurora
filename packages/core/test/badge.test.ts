import { describe, expect, it } from 'vitest'
import { auroraBadge } from '@/badge'

describe('optional attribution', () => {
  it('is a complete, static, accessible image/link descriptor without a browser', () => {
    expect(auroraBadge()).toEqual({
      href: 'https://aurora.goatsoft.io/',
      src: 'https://aurora.goatsoft.io/badges/v1/made-with-inline-auto.svg',
      alt: 'Made with Aurora',
      width: 148,
      height: 32,
    })
  })

  it('preserves the original stacked card and URLs', () => {
    expect(auroraBadge({ layout: 'stacked' })).toMatchObject({
      src: 'https://aurora.goatsoft.io/badges/v1/made-with-auto.svg', width: 168, height: 48,
    })
  })

  it('supports explicit themes, optional animation and self-hosting', () => {
    expect(auroraBadge({ label: 'powered-by', theme: 'dark', animated: true, baseUrl: '/brand/badges/' })).toMatchObject({
      src: '/brand/badges/powered-by-inline-dark-animated.svg',
      alt: 'Powered by Aurora',
    })
    expect(auroraBadge({ label: 'enabled', theme: 'light', baseUrl: 'https://cdn.example.com/badges///' })).toMatchObject({
      src: 'https://cdn.example.com/badges/enabled-inline-light.svg',
      alt: 'Aurora enabled',
    })
  })
})
