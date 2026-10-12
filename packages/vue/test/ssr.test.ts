import { compileCss } from '@goatsoft/aurora'
import type { AuroraSource } from '@goatsoft/aurora'
import { assertAurora } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { AuroraBackground, AuroraScene } from '@/index'

const doc = assertAurora({ format: 'aurora', version: 1, name: 'T', canvas: { fade: 'y' }, palette: ['oklch(0.68 0.16 245)', 'oklch(0.56 0.22 285)', 'oklch(0.58 0.25 310)'], layers: [{ type: 'aurora-fbm' }] })
const module = { id: 'hero.aurora', doc, css: compileCss(doc) }
const html = (props: { src: AuroraSource | string }) => renderToString(createSSRApp({ render: () => h(AuroraScene, { name: 's' }, () => h(AuroraBackground, props)) }))

describe('server rendering', () => {
  it('renders the CSS fallback into the HTML, hidden from assistive tech', async () => {
    const out = await html({ src: module })
    expect(out).toMatch(/^(<!--\[-->)?<div class="aurora-background" aria-hidden="true" style="position:absolute;inset:0;overflow:hidden;pointer-events:none" data-aurora-ssr>/)
    expect(out).toContain('background-image:radial-gradient(60% 40% at 20% 30% in oklab, oklch(0.68 0.16 245 / 0.28), transparent 70%)')
    expect(out).toContain('mask-image:linear-gradient(to bottom')
  })

  it('compiles the fallback for plain documents, and renders the slot with mode "css"', async () => {
    const out = await renderToString(createSSRApp({ render: () => h(AuroraBackground, { src: doc }, { default: ({ mode }: { mode: string }) => [h('span', mode)] }) }))
    expect(out).toContain('background-image:radial-gradient(')
    expect(out).toContain('<span>css</span>')
  })

  it('renders no fallback for URLs, which load in the browser', async () => {
    expect(await html({ src: '/hero.aurora' })).not.toContain('background-image')
  })
})
