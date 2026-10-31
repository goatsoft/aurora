import type { PageInfo } from '@/index'
import type { DocsOptions } from '@/vue'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderToString } from 'vue/server-renderer'
import { breadcrumbTrail, CopyButton, DocPage, gruffDocs, navGroups, Term } from '@/vue'

const page = (route: string, title: string, extra: Partial<PageInfo> = {}): PageInfo => ({ route, title, description: undefined, order: undefined, sidebarTitle: undefined, ...extra })
const pages = [
  page('/docs', 'Docs home', { order: 0 }),
  page('/docs/components', 'Components'),
  page('/docs/components/button', 'The button', { sidebarTitle: 'Button' }),
  page('/docs/components/badge', 'Badge'),
  page('/docs/guide/install', 'Install', { order: 1 }),
]
const groups = [
  { title: 'Start', match: (r: string) => r === '/docs' || r.startsWith('/docs/guide/') },
  { title: 'Components', match: (r: string) => r.startsWith('/docs/components') },
  { title: 'Empty', match: () => false },
]
const data: DocsOptions['data'] = {
  searchIndex: '',
  searchFields: { fields: ['title'] },
  glossary: [{ id: 'scrim', term: 'Scrim', definition: 'The dim layer under a dialog.', aliases: [] }],
}

async function render(path: string, component: Parameters<typeof h>[0], props: Record<string, unknown>, options: Partial<DocsOptions> = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:any(.*)*', component: { render: () => null } }] })
  const app = createSSRApp({ render: () => h(component, props, { default: () => 'Page body' }) })
  app.use(router)
  app.use(gruffDocs({ data, nav: navGroups(pages, groups), ...options }))
  await router.push(path)
  await router.isReady()
  return renderToString(app)
}

describe('the docs helpers', () => {
  it('groups pages for the sidebar by order then route, leaving out empty groups', () => {
    expect(navGroups(pages, groups).map((g) => [g.title, g.items.map((p) => p.route)])).toEqual([
      ['Start', ['/docs', '/docs/guide/install']],
      ['Components', ['/docs/components', '/docs/components/badge', '/docs/components/button']],
    ])
  })

  it('builds a trail of the pages above a page, skipping folders without one', () => {
    expect(breadcrumbTrail(pages, '/docs/components/button')).toEqual([{ title: 'Docs', route: '/docs' }, { title: 'Components', route: '/docs/components' }])
    expect(breadcrumbTrail(pages, '/docs/guide/install')).toEqual([{ title: 'Docs', route: '/docs' }])
    expect(breadcrumbTrail(pages, '/docs')).toEqual([])
    expect(breadcrumbTrail(pages, '/docsy/x')).toEqual([])
    expect(breadcrumbTrail(pages, '/manual/a/b', { base: '/manual/', home: 'Manual' })).toEqual([{ title: 'Manual', route: '/manual' }])
  })
})

describe('the docs components', () => {
  it('lay out a page: sidebar titles, the current page, breadcrumbs, previous and next, and the head', async () => {
    const useHead = vi.fn()
    const html = await render('/docs/components/button', DocPage, { frontmatter: { title: 'The button', description: 'Press it.' } }, {
      breadcrumbs: (route) => breadcrumbTrail(pages, route),
      useHead,
    })
    expect(html).toContain('Page body')
    expect(html).toMatch(/<a aria-current="page" href="\/docs\/components\/button" class="[^"]*font-medium text-foreground"><span[^>]*><\/span> Button<\/a>/)
    expect(html).toMatch(/aria-label="Breadcrumb".*href="\/docs\/".*Docs.*href="\/docs\/components\/".*Components.*aria-current="page"[^>]*>The button</s)
    // Last in sidebar order: the badge before it, nothing after.
    expect(html).toMatch(/Previous.*Badge<\/span><\/a><!----><\/nav>/s)
    expect(await render('/docs/guide/install', DocPage, { frontmatter: { title: 'Install' } })).toMatch(/Previous.*Docs home.*Next.*>Components<svg/s)
    expect(html).toContain('data-icon="chevronDown"')
    expect(useHead).toHaveBeenCalledOnce()
    const [meta] = useHead.mock.calls[0] as [{ title: () => string, description: () => string }]
    expect([meta.title(), meta.description()]).toEqual(['The button', 'Press it.'])
  })

  it('show no trail without breadcrumbs, and draw the icons a site passes', async () => {
    const html = await render('/docs/components/button', DocPage, { frontmatter: { title: 'The button' } }, {
      icons: { chevronDown: { render: () => h('i', { class: 'site-icon' }) } },
    })
    expect(html).not.toContain('aria-label="Breadcrumb"')
    expect(html).toContain('<i class="site-icon size-4 transition-transform"></i>')
    expect(html).not.toContain('data-icon="chevronDown"')
  })

  it('link a glossary term to its entry on the glossary page', async () => {
    expect(await render('/docs', Term, { id: 'scrim' })).toContain('href="/docs/glossary#scrim"')
    expect(await render('/docs', Term, { id: 'scrim' }, { glossaryRoute: '/reference/terms' })).toContain('href="/reference/terms#scrim"')
  })

  it('draw a copy button with the built-in icon', async () => {
    const html = await render('/docs', CopyButton, { code: 'x' })
    expect(html).toContain('aria-label="Copy code"')
    expect(html).toMatch(/<svg [^>]*data-icon="copy" class="size-4"><rect /)
  })

  it('need the docs installed', async () => {
    const app = createSSRApp({ render: () => h(CopyButton, { code: 'x' }) })
    app.config.warnHandler = () => undefined
    await expect(renderToString(app)).rejects.toThrow('gruff: the docs components need app.use(gruffDocs({ ... }))')
  })
})
