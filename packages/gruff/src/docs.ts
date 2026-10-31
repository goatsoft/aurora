import type { GlossaryEntry } from './glossary'
import type { PageInfo, SearchDocument } from './search'
import type { Options } from 'minisearch'
import type { Component, InjectionKey } from 'vue'
import { inject } from 'vue'
import { defaultIcons } from './icons'

/** A sidebar group: a heading and its pages. */
export interface NavGroup {
  title: string
  items: PageInfo[]
}

/** A page above the current one, in the breadcrumb trail. */
export interface Crumb {
  title: string
  route: string
}

/** The icons the docs components draw. Each is a component that takes a `class`. */
export type DocsIcon = 'check' | 'chevronDown' | 'chevronLeft' | 'chevronRight' | 'copy' | 'search'

export interface DocsOptions {
  /** What `virtual:gruff` exports: `import * as data from 'virtual:gruff'`. */
  data: { searchIndex: string, searchFields: Options<SearchDocument>, glossary: GlossaryEntry[] }
  /** The sidebar (`navGroups` builds it from the pages). */
  nav: NavGroup[]
  /** The pages in reading order, for previous and next links. Defaults to the sidebar's order. */
  sequence?: PageInfo[]
  /** The trail above a page (`breadcrumbTrail` builds one). Without it, pages show no trail. */
  breadcrumbs?: (route: string) => Crumb[]
  /** Called while a page sets up, with its title and description, for the site's head manager. */
  useHead?: (meta: { title: () => string | undefined, description: () => string | undefined }) => void
  /** The line under an empty search box. */
  searchHint?: string
  /** The glossary page, which glossary terms link to. Defaults to `/docs/glossary`. */
  glossaryRoute?: string
  /** Icons to use in place of the built-in ones. */
  icons?: Partial<Record<DocsIcon, Component>>
}

/** The installed docs, with the defaults filled in. */
export interface Docs extends Omit<DocsOptions, 'glossaryRoute' | 'icons' | 'searchHint' | 'sequence'> {
  sequence: PageInfo[]
  searchHint: string
  glossaryRoute: string
  icons: Record<DocsIcon, Component>
}

export const DOCS: InjectionKey<Docs> = Symbol('gruff docs')

export function resolveDocs(options: DocsOptions): Docs {
  return {
    ...options,
    sequence: options.sequence ?? options.nav.flatMap((group) => group.items),
    searchHint: options.searchHint ?? 'Search every page of the docs.',
    glossaryRoute: options.glossaryRoute ?? '/docs/glossary',
    icons: { ...defaultIcons, ...options.icons },
  }
}

/** The docs `gruffDocs` installed. */
export function useDocs(): Docs {
  const docs = inject(DOCS, undefined)
  if (!docs) throw new Error('gruff: the docs components need app.use(gruffDocs({ ... }))')
  return docs
}

const byOrder = (a: PageInfo, b: PageInfo) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.route.localeCompare(b.route)

/** Sidebar groups from the pages: each group's matching pages, sorted by frontmatter `order`, then route. Empty groups are left out. */
export function navGroups(pages: PageInfo[], groups: { title: string, match: (route: string) => boolean }[]): NavGroup[] {
  return groups.map(({ title, match }) => ({ title, items: pages.filter((page) => match(page.route)).sort(byOrder) }))
    .filter((group) => group.items.length)
}

/**
 * The pages above a page, from the docs home down: for `/docs/components/button` that is Docs,
 * then Components. The page itself is left out (the layout adds it from its title), and so are
 * folders without a page of their own. The docs home, and pages outside `base`, get no trail.
 */
export function breadcrumbTrail(pages: PageInfo[], route: string, options: { base?: string, home?: string } = {}): Crumb[] {
  const base = (options.base ?? '/docs').replace(/\/$/, '')
  if (route !== base && !route.startsWith(`${base}/`)) return []
  const parts = route.slice(base.length).split('/').filter(Boolean)
  if (parts.length === 0) return []
  const trail: Crumb[] = [{ title: options.home ?? 'Docs', route: base }]
  for (let i = 1; i < parts.length; i++) {
    const path = `${base}/${parts.slice(0, i).join('/')}`
    const page = pages.find((p) => p.route === path)
    if (page) trail.push({ title: page.title, route: page.route })
  }
  return trail
}
