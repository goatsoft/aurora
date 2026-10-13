import { describe, expect, it } from 'vitest'
import { auroraBadge } from '@/badge'

const assets = import.meta.glob<string>('~/assets/brand/badges/v1/*.svg', { query: '?raw', import: 'default', eager: true })
const original = Object.values(import.meta.glob<string>('~/assets/brand/favicon-dark.svg', { query: '?raw', import: 'default', eager: true }))[0]!

describe('official badge assets', () => {
  it('ships every public option and keeps the approved compact mark unchanged', () => {
    expect(Object.keys(assets)).toHaveLength(36)
    const mark = /<path d="([^"]+)"/.exec(original)![1]!
    for (const layout of ['inline', 'stacked'] as const) {
      for (const label of ['made-with', 'powered-by', 'enabled'] as const) {
        for (const theme of ['auto', 'light', 'dark'] as const) {
          for (const animated of [false, true]) {
            const badge = auroraBadge({ label, theme, animated, layout, baseUrl: 'assets/brand/badges/v1' })
            const svg = Object.entries(assets).find(([path]) => path.endsWith(`/${badge.src}`))?.[1]
            expect(svg).toContain(`aria-label="${badge.alt}"`)
            expect(svg).toContain(`viewBox="0 0 ${badge.width} ${badge.height}"`)
            expect(svg).toContain(`d="${mark}"`)
            expect(svg).not.toContain('{{')
            expect(svg).toContain(theme === 'dark' ? '.panel{fill:#141421}' : '.panel{fill:#fcfbff}')
            if (theme === 'auto') expect(svg).toContain('@media(prefers-color-scheme:dark)')
            expect(svg).not.toMatch(/<script|<image|<foreignObject|https?:\/\/(?!www.w3.org)/)
            if (animated) expect(svg).toContain('@media(prefers-reduced-motion:no-preference)')
            else expect(svg).not.toContain('@keyframes')
          }
        }
      }
    }
  })
})
