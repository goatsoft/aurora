import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import MarkdownIt from 'markdown-it'
import vue from '@vitejs/plugin-vue'
import { createServer } from 'vite'
import { describe, expect, inject, it } from 'vitest'
import { buildSearchIndex, containers, glossaryLinks, gruff, highlight, links, parseGlossary, parseInfo, prerender, toc } from '@/index'

const root = inject('root')
const fixtures = resolve(root, 'packages/gruff/test/fixtures')
const page = join(fixtures, 'docs/index.md')
const route = (file: string) => (file.startsWith(join(fixtures, 'docs')) ? `/docs/${file.slice(join(fixtures, 'docs').length + 1).replace(/(index)?\.md$/, '')}`.replace(/\/$/, '') || '/docs' : undefined)

async function render(markdown: string, env: Record<string, unknown> = { id: page }) {
  const md = new MarkdownIt({ html: true })
  toc(md)
  containers(md)
  links(md, { root, route, repoUrl: 'https://github.com/goatsoft/aurora/blob/main/' })
  glossaryLinks(md, join(fixtures, 'glossary.md'))
  await highlight(md)
  return { html: md.render(markdown, env), env }
}

describe('markdown', () => {
  it('anchors headings like GitHub and exports the outline and title', async () => {
    const { html, env } = await render('# Hello\n\n## Get started\n\n### Vite & Vue\n')
    expect(html).toContain('<h2 id="get-started" tabindex="-1"><a class="heading-anchor" href="#get-started" aria-hidden="true">#</a> Get started</h2>')
    expect(env['frontmatter']).toEqual({ title: 'Hello', toc: [{ id: 'get-started', text: 'Get started', level: 2 }, { id: 'vite--vue', text: 'Vite & Vue', level: 3 }] })
  })

  it('routes .md links, sends other files to GitHub, and opens other sites in a new tab', async () => {
    const { html } = await render('[a](guide/setup.md#install) [b](../adr.md) [c](https://x.dev) [d](#top)')
    expect(html).toContain('<a href="/docs/guide/setup#install">a</a>')
    expect(html).toContain('href="https://github.com/goatsoft/aurora/blob/main/packages/gruff/test/fixtures/adr.md" target="_blank" rel="noopener"')
    expect(html).toContain('<a href="https://x.dev" target="_blank" rel="noopener">c</a>')
    expect(html).toContain('<a href="#top">d</a>')
  })

  it('makes repo-absolute images relative, so the bundler imports them', async () => {
    const { html } = await render('![Fire](/packages/core/test/golden/fire.png)', { id: resolve(root, 'docs/generators/fire.md') })
    expect(html).toContain('src="../../packages/core/test/golden/fire.png"')
    expect(html).toContain('loading="lazy"')
  })

  it('renders callouts, details and code groups', async () => {
    const { html } = await render('::: warning Careful\nHot.\n:::\n\n::: details More\nHidden.\n:::\n\n::: code-group\n```sh [pnpm]\npnpm i\n```\n:::\n')
    expect(html).toContain('<div class="callout callout-warning" role="note"><p class="callout-title">Careful</p>')
    expect(html).toContain('<details class="callout callout-details"><summary>More</summary>')
    expect(html).toMatch(/<CodeGroup>\n<div class="code-block" data-lang="sh" data-title="pnpm">/)
  })

  it('highlights code in both themes with notation, and renders aurora fences live', async () => {
    const { html } = await render('```ts [a.ts]\nconst x = 1 // [!code highlight]\n```\n\n```aurora\n{"a":1}\n```\n')
    expect(html).toContain('<div class="code-title">a.ts</div>')
    expect(html).toContain('class="line highlighted"')
    expect(html).toContain('--shiki-dark:')
    expect(html).toContain('<CopyButton code="const x = 1 // [!code highlight]\n" />')
    expect(html).toMatch(/<AuroraDemo source="\{&quot;a&quot;:1\}\n" code="&lt;pre/)
  })

  it('links the first use of each glossary term, longest name first, outside links', async () => {
    const { html } = await render('The CSS fallback and the fallback. [WebGPU](x) then WebGPU and WebGPU.')
    expect(html).toContain('The <Term id="css-fallback">CSS fallback</Term> and the fallback.')
    expect(html).toContain('<a href="https://github.com/goatsoft/aurora/blob/main/packages/gruff/test/fixtures/docs/x" target="_blank" rel="noopener">WebGPU</a> then <Term id="webgpu">WebGPU</Term> and WebGPU.')
    const { html: off } = await render('---\nglossary: false\n---\nWebGPU', { id: page, frontmatter: { glossary: false } })
    expect(off).not.toContain('<Term')
  })

  it('parses the glossary and fence info', () => {
    expect(parseGlossary(readFileSync(join(fixtures, 'glossary.md'), 'utf8'))).toEqual([
      { id: 'css-fallback', term: 'CSS fallback', definition: 'The background shown without WebGPU.', aliases: ['fallback'] },
      { id: 'webgpu', term: 'WebGPU', definition: 'The GPU API for the web.', aliases: [] },
    ])
    expect(parseInfo('ts [vite.config.ts] {1}')).toEqual({ lang: 'ts', title: 'vite.config.ts' })
    expect(parseInfo('')).toEqual({ lang: '', title: undefined })
  })
})

describe('search', () => {
  it('indexes each ## section of each page, skipping code', () => {
    const index = JSON.parse(buildSearchIndex([{ file: page, route: '/docs' }, { file: join(fixtures, 'docs/guide/setup.md'), route: '/docs/guide/setup' }])) as { documentCount: number, storedFields: Record<string, { title: string, section: string }> }
    expect(index.documentCount).toBe(4)
    expect(Object.values(index.storedFields)).toContainEqual({ title: 'Setup', section: 'Install' })
    expect(JSON.stringify(index)).not.toContain('[!code')
  })
})

describe('prerender', () => {
  it('writes a page per route and a 404 from the template', async () => {
    const out = mkdtempSync(join(tmpdir(), 'gruff-'))
    writeFileSync(join(out, 'index.html'), '<!doctype html><html><head><!--head--></head><body><div id="app"><!--app--></div></body></html>')
    const files = await prerender({
      outDir: out,
      routes: ['/', '/docs/guide'],
      notFound: '/404',
      render: (url) => Promise.resolve({ html: `<p>${url}</p>`, head: `<title>${url}</title>`, htmlAttrs: 'lang="en"' }),
    })
    expect(files.map((f) => f.slice(out.length))).toEqual(['/index.html', '/docs/guide/index.html', '/404.html'])
    expect(readFileSync(join(out, 'docs/guide/index.html'), 'utf8')).toBe('<!doctype html><html lang="en"><head><title>/docs/guide</title></head><body><div id="app"><p>/docs/guide</p></div></body></html>')
  })

  it('says what the template is missing', async () => {
    const out = mkdtempSync(join(tmpdir(), 'gruff-'))
    writeFileSync(join(out, 'index.html'), '<html></html>')
    await expect(prerender({ outDir: out, routes: ['/'], render: () => Promise.resolve({ html: '', head: '' }) }))
      .rejects.toThrow(`prerender: ${join(out, 'index.html')} needs <!--head--> in <head> and <!--app--> inside the app element.`)
  })
})

describe('the Vite plugin', () => {
  it('turns a page into a Vue component in its layout, and serves search and glossary', async () => {
    const server = await createServer({
      root: fixtures,
      logLevel: 'silent',
      configFile: false,
      plugins: [...gruff({ root, route, repoUrl: 'https://github.com/goatsoft/aurora/blob/main/', glossary: join(fixtures, 'glossary.md'), pages: () => [{ file: page, route: '/docs' }] }), vue({ include: [/\.vue$/, /\.md$/] })],
      server: { middlewareMode: true, hmr: false },
    })
    try {
      const md = await server.transformRequest('/docs/index.md')
      expect(md?.code).toContain('DocPage')
      expect(md?.code).toContain('"description":"Start here."')
      expect(md?.code).toContain('"toc":[{"id":"install","text":"Install","level":2}]')
      const virtual = await server.ssrLoadModule('virtual:gruff') as { searchIndex: string, glossary: unknown[] }
      expect(JSON.parse(virtual.searchIndex)).toMatchObject({ documentCount: 2 })
      expect(virtual.glossary).toHaveLength(2)
    } finally {
      await server.close()
    }
  })
})
