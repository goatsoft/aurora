---
description: Every export of @goatsoft/gruff, @goatsoft/gruff/vue and virtual:gruff, with its options and types.
order: 5
---

# API reference

## `@goatsoft/gruff`

Runs in Node: your Vite config and build scripts.

### `gruff(options): Plugin[]`

The Vite plugins: Markdown pages as Vue components, plus `virtual:gruff`. Spread them into `plugins` before `@vitejs/plugin-vue`, and give that plugin `include: [/\.vue$/, /\.md$/]`.

```ts
interface GruffOptions {
  /** The repository root: a link to `/x` in a page means `<root>/x`. */
  root: string
  /** A Markdown file's route, or undefined when it isn't a page of the site. */
  route: (file: string) => string | undefined
  /** Where links to files that aren't pages go, e.g. 'https://github.com/org/repo/blob/main/'. */
  repoUrl: string
  /** Every page, for search and navigation. Called again in dev when pages are added or removed. */
  pages: () => { file: string, route: string }[]
  /** The glossary file (`## Term` entries), linked from first uses on every page. */
  glossary?: string
  /** Route prefix for `[[Page]]` links. Default '/docs/'. */
  wikiBase?: string
  /** The component pages render inside (it receives `frontmatter`), or a function of the file's path returning a name or null for none. Default 'DocPage'. */
  layout?: string | ((id: string) => string | null)
  /** Shiki themes and languages, and custom fences. */
  highlight?: HighlightOptions
}
```

Pages are wrapped in `<div class="prose">` inside the layout, HTML in Markdown is allowed, URLs become links and typographic quotes are on. In dev, adding or removing a page reloads the browser with a fresh page list; editing one refreshes titles and search on the next load.

### `HighlightOptions`

```ts
interface HighlightOptions {
  /** Default { light: 'github-light', dark: 'github-dark-dimmed' }. Any Shiki theme names. */
  themes?: { light: BundledTheme, dark: BundledTheme }
  /** Replaces the default languages: ts, js, vue, html, css, json, jsonc, sh, md, yaml, diff, toml, wgsl, luau, lua. */
  langs?: BundledLanguage[]
  /** Renderers for fences by language, in place of a code block. */
  fences?: Record<string, Fence>
}

type Fence = (source: string, code: (source: string, lang: string) => string, md: MarkdownIt) => string
```

### `prerender(options): Promise<string[]>`

Writes static HTML for every route into the client build. See [Prerendering](prerender.md).

```ts
interface PrerenderOptions {
  outDir: string
  routes: string[]
  render: (url: string) => Promise<RenderResult>
  notFound?: string
  inlineCss?: boolean
  hydrate?: 'eager' | 'idle'
  subsetFonts?: boolean | { axes?: Record<string, AxisRange> }
}

interface RenderResult {
  html: string
  head: string
  htmlAttrs?: string
}

type AxisRange = number | { min: number, max: number }
```

### Search and pages

| Export | What it does |
| --- | --- |
| `pageInfo(file, route): PageInfo` | A page's title (frontmatter, else first `#` heading, else route), description, order and sidebar title. |
| `buildSearchIndex(pages): string` | A serialised MiniSearch index, one document per `##` section. Pages with `search: false` are skipped. |
| `SEARCH_FIELDS` | The MiniSearch options the index was built with; load it with the same ones. |

```ts
interface PageInfo {
  route: string
  title: string
  description: string | undefined
  order: number | undefined
  sidebarTitle: string | undefined
}

interface SearchDocument {
  id: string       // route, or route#heading
  title: string    // the page title
  section: string  // the ## heading, or '' for the page's intro
  text: string
}
```

### Building blocks

`gruff()` is made of these markdown-it plugins, exported for use in your own pipeline:

| Export | What it does |
| --- | --- |
| `toc(md)` | Heading ids and anchors; sets `env.frontmatter.toc` and, from the first `#`, `env.frontmatter.title`. |
| `headingId(text)` | GitHub's heading id for some text. |
| `containers(md)` | `::: tip`, `note`, `warning`, `danger`, `details` and `code-group`. |
| `highlight(md, options?)` | Shiki fences with titles, notation, copy buttons and custom fences. Async: await it before rendering. |
| `createCodeHighlighter(options?)` | The highlighter alone: `(source, lang) => html`. |
| `parseInfo(info)` | A fence's info string to `{ lang, title }`. |
| `links(md, options)` | GitHub-style link and image resolution. Takes `{ root, route, repoUrl }` (`LinkOptions`). |
| `wikilinks(md, base?)` | `[[Page]]` and `[[Text\|Page#Anchor]]`. |
| `slugify(name)` | A wikilink name as a route segment. |
| `glossaryLinks(md, file)` | Links the first use of each glossary term on a page. |
| `parseGlossary(markdown): GlossaryEntry[]` | Parses a glossary file. |
| `pageCharacters(html)` | Every character an HTML page can show (used for font subsetting). |
| `idleLoader(src)` | The inline script `hydrate: 'idle'` uses. |

```ts
interface GlossaryEntry {
  id: string        // the term's anchor on the glossary page
  term: string
  definition: string
  aliases: string[]
}

interface TocEntry {
  id: string
  text: string
  level: number     // 2 or 3
}
```

## `virtual:gruff`

Served by the plugins; import it in your app. Add `"@goatsoft/gruff/client"` to `compilerOptions.types` for its types.

| Export | Type |
| --- | --- |
| `pages` | `PageInfo[]`, in the order `pages()` returned them |
| `searchIndex` | `string` (serialised MiniSearch) |
| `searchFields` | MiniSearch `Options<SearchDocument>` |
| `glossary` | `GlossaryEntry[]` (empty without a glossary) |

## `@goatsoft/gruff/vue`

Runs in the browser and during server rendering. See [Docs components](components.md).

| Export | What it is |
| --- | --- |
| `gruffDocs(options): Plugin` | Installs the docs: provides the options and registers `DocPage`, `CopyButton`, `CodeGroup` and `Term`. |
| `useDocs(): Docs` | The installed options, with defaults filled in. Throws outside `gruffDocs`. |
| `navGroups(pages, groups): NavGroup[]` | Sidebar groups: `groups` is `{ title, match(route) }[]`; pages sort by `order`, then route; empty groups are dropped. |
| `breadcrumbTrail(pages, route, { base?, home? }): Crumb[]` | The pages above a route. `base` defaults to `/docs`, `home` to `'Docs'`. |
| `DocPage`, `DocToc`, `SearchDialog`, `CodeGroup`, `CopyButton`, `Term` | The components. |
| `defaultIcons` | The built-in icon components. |
| `DOCS` | The injection key `gruffDocs` provides. |

```ts
interface DocsOptions {
  data: { searchIndex: string, searchFields: Options<SearchDocument>, glossary: GlossaryEntry[] }
  nav: NavGroup[]
  sequence?: PageInfo[]
  breadcrumbs?: (route: string) => Crumb[]
  useHead?: (meta: { title: () => string | undefined, description: () => string | undefined }) => void
  searchHint?: string
  glossaryRoute?: string
  icons?: Partial<Record<DocsIcon, Component>>
}

interface NavGroup { title: string, items: PageInfo[] }
interface Crumb { title: string, route: string }
type DocsIcon = 'check' | 'chevronDown' | 'chevronLeft' | 'chevronRight' | 'copy' | 'search'
```

## `@goatsoft/gruff/client`

Types only: declares `virtual:gruff` and `*.md` (as Vue components).
