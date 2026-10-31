import type { HighlightOptions } from './highlight'
import type { LinkOptions } from './links'
import type { MarkdownIt } from 'markdown-it'
import type { Plugin } from 'vite'
import { dirname } from 'node:path'
import Markdown from 'unplugin-vue-markdown/vite'
import { containers } from './containers'
import { glossaryLinks, parseGlossary } from './glossary'
import { highlight } from './highlight'
import { links } from './links'
import { buildSearchIndex, pageInfo, SEARCH_FIELDS } from './search'
import { toc } from './toc'
import { wikilinks } from './wikilinks'

export interface GruffOptions extends LinkOptions {
  /** Every page of the site, for search. */
  pages: () => { file: string, route: string }[]
  /** The glossary file (`## Term` entries), linked from first uses on every page. */
  glossary?: string
  /** Route prefix for `[[Page]]` links. */
  wikiBase?: string
  /** The Vue component pages render inside (it receives `frontmatter`), or a function choosing one per file (null for none). */
  layout?: string | ((id: string) => string | null)
  highlight?: HighlightOptions
}

const VIRTUAL = 'virtual:gruff'

/**
 * gruff: the rough and ready static site generator. Markdown files become Vue components
 * (unplugin-vue-markdown) with heading anchors and an outline, Shiki code blocks, callouts and
 * code groups, custom fences (live demos), GitHub-style links that work in the repo and on the site,
 * wikilinks and glossary terms. `virtual:gruff` exports the search index, the pages (titles, for
 * navigation) and the glossary; use
 * `prerender` after building to write static HTML for every route.
 */
export function gruff(options: GruffOptions): Plugin[] {
  return [
    Markdown({
      headEnabled: false,
      wrapperClasses: 'prose',
      wrapperComponent: options.layout ?? 'DocPage',
      wrapperDiv: true,
      markdownOptions: { html: true, linkify: true, typographer: true },
      async markdownSetup(engine) {
        const md = engine as unknown as MarkdownIt
        toc(md)
        containers(md)
        wikilinks(md, options.wikiBase)
        links(md, options)
        if (options.glossary) glossaryLinks(md, options.glossary)
        await highlight(md, options.highlight)
      },
    }) as Plugin,
    {
      name: 'gruff',
      // The page list is built once, so the dev server rebuilds it when pages come and go.
      // Page folders can sit outside Vite's root (a repo's docs/), so they are watched here.
      configureServer(server) {
        const dirs = new Set(options.pages().map(({ file }) => dirname(file)))
        for (const dir of dirs) server.watcher.add(dir)
        const isPage = (file: string) => file.endsWith('.md') && options.route(file) !== undefined
        const stale = (reload: boolean) => {
          const module = server.moduleGraph.getModuleById(`\0${VIRTUAL}`)
          if (module) server.moduleGraph.invalidateModule(module)
          if (reload) server.ws.send({ type: 'full-reload' })
        }
        server.watcher.on('add', (file) => isPage(file) && stale(true))
        server.watcher.on('unlink', (file) => isPage(file) && stale(true))
        // An edit can change a title, order or the search text: the next load picks it up.
        server.watcher.on('change', (file) => isPage(file) && stale(false))
      },
      resolveId: (id) => (id === VIRTUAL ? `\0${VIRTUAL}` : undefined),
      async load(id) {
        if (id !== `\0${VIRTUAL}`) return undefined
        const { readFile } = await import('node:fs/promises')
        const glossary = options.glossary ? parseGlossary(await readFile(options.glossary, 'utf8')) : []
        const pages = options.pages()
        const nav = pages.map(({ file, route }) => pageInfo(file, route))
        return [
          `export const searchIndex = ${JSON.stringify(buildSearchIndex(pages))}`,
          `export const searchFields = ${JSON.stringify(SEARCH_FIELDS)}`,
          `export const pages = ${JSON.stringify(nav)}`,
          `export const glossary = ${JSON.stringify(glossary)}`,
        ].join('\n')
      },
    },
  ]
}

export { containers } from './containers'
export { glossaryLinks, parseGlossary } from './glossary'
export type { GlossaryEntry } from './glossary'
export { createCodeHighlighter, highlight, parseInfo } from './highlight'
export type { Fence, HighlightOptions } from './highlight'
export { links } from './links'
export type { LinkOptions } from './links'
export { idleLoader, pageCharacters, prerender } from './prerender'
export type { AxisRange, PrerenderOptions, RenderResult } from './prerender'
export { buildSearchIndex, pageInfo, SEARCH_FIELDS } from './search'
export type { PageInfo, SearchDocument } from './search'
export { headingId, toc } from './toc'
export type { TocEntry } from './toc'
export { slugify, wikilinks } from './wikilinks'
