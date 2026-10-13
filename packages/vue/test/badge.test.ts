import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { AuroraBadge } from '@/badge'

describe('<AuroraBadge>', () => {
  it('server-renders a keyboard-accessible link and a labelled image with reserved dimensions', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(AuroraBadge) }))
    expect(html).toBe('<a href="https://aurora.goatsoft.io/"><img src="https://aurora.goatsoft.io/badges/v1/made-with-inline-auto.svg" alt="Made with Aurora" width="148" height="32" decoding="async"></a>')
  })

  it('passes options through and preserves consumer link attributes', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(AuroraBadge, {
      label: 'enabled', layout: 'stacked', theme: 'dark', animated: true, baseUrl: '/badges', class: 'footer-badge',
    }) }))
    expect(html).toContain('class="footer-badge"')
    expect(html).toContain('src="/badges/enabled-dark-animated.svg" alt="Aurora enabled"')
  })
})
