---
description: The ready-made docs UI in @goatsoft/gruff/vue - install, theme tokens, icons and your own layout.
order: 3
---

# Docs components

`@goatsoft/gruff/vue` is a docs UI for gruff pages: a layout with a sidebar, breadcrumbs, previous and next links and an outline, a search dialog, code groups, copy buttons and glossary cards. It is optional: gruff pages work with any layout you write.

The components are styled with Tailwind 4 classes and shadcn-style theme tokens, the way you would style your own components, so they take on your site's theme. That means your Tailwind build must see them (`@source`) and your theme must define the tokens below.

## Install

```sh
npm install reka-ui vue-router
npm install -D tailwindcss @tailwindcss/vite
```

```ts
import { breadcrumbTrail, gruffDocs, navGroups } from '@goatsoft/gruff/vue'
import * as data from 'virtual:gruff'

const nav = navGroups(data.pages, [
  { title: 'Guide', match: (route) => route === '/docs' || route.startsWith('/docs/guide/') },
  { title: 'API', match: (route) => route.startsWith('/docs/api/') },
])

app.use(gruffDocs({
  data,
  nav,
  breadcrumbs: (route) => breadcrumbTrail(data.pages, route),
  useHead: ({ title, description }) => { /* your head manager */ },
  searchHint: 'Guides and API reference.',
}))
```

`app.use(gruffDocs(...))` must come after `app.use(router)`. It provides the options to the components and registers the four that gruff's pages refer to by name: `DocPage`, `CopyButton`, `CodeGroup` and `Term`.

### Options

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `data` | `{ searchIndex, searchFields, glossary }` | required | What `virtual:gruff` exports. Pass the whole module: `import * as data from 'virtual:gruff'`. |
| `nav` | `NavGroup[]` | required | The sidebar. `navGroups(pages, groups)` builds it. |
| `sequence` | `PageInfo[]` | sidebar order | Reading order for previous and next links. |
| `breadcrumbs` | `(route) => Crumb[]` | none | The trail above the page. `breadcrumbTrail(pages, route, { base, home })` builds one from the URL. Without it, no trail. |
| `useHead` | `({ title, description }) => void` | none | Called once while each page sets up, with getters for its title and description. Hook your head manager here. It runs inside the page's `setup`, so `inject` works. |
| `searchHint` | `string` | `'Search every page of the docs.'` | The line under an empty search box. |
| `glossaryRoute` | `string` | `'/docs/glossary'` | Where glossary terms link to. |
| `icons` | `Partial<Record<DocsIcon, Component>>` | built-in strokes | Your own icons (below). |

## Theme

The components use these Tailwind colours. Define each as a theme colour, for example with `@theme inline { --color-surface: var(--surface); }`:

| Token | Used for |
| --- | --- |
| `background` | The search dialog's backdrop (at 60%). |
| `foreground` | Current and hovered text. |
| `muted-foreground` | Sidebar links, labels, secondary text. |
| `surface` | Search button and copy button fills. |
| `border` | Every border and divider. |
| `primary` | The active outline entry, hovered page links, the copied tick. |
| `ring` | Focus rings on code-group tabs. |
| `spectrum-1`, `spectrum-2` | The accent gradient on the current sidebar page and the active code tab. Point both at `primary` for a flat accent. |

And one utility, `glass`, for the search dialog and glossary cards:

```css
@utility glass {
  background: color-mix(in oklab, var(--surface) 95%, transparent);
  backdrop-filter: blur(18px);
  border: 1px solid var(--border);
}
```

Tell Tailwind to read the components' classes. The path is relative to your stylesheet:

```css
@source "../node_modules/@goatsoft/gruff/dist";
```

The [stylesheet in Getting started](getting-started.md#styles) is a complete starting point, with styles for gruff's Markdown output too.

### Classes the Markdown output uses

gruff's HTML uses plain class names you style yourself:

| Class | On |
| --- | --- |
| `prose` | The page wrapper (inside the layout). |
| `heading-anchor` | The `#` link inside each heading. |
| `callout`, `callout-tip`, `callout-note`, `callout-warning`, `callout-danger`, `callout-details`, `callout-title` | Callouts. |
| `code-block`, `code-title` | Code blocks and their title bars. `data-lang` and `data-title` are set on `.code-block`. |
| `shiki`, `line`, `highlighted`, `diff add`, `diff remove`, `focused`, `has-focused` | Shiki's output and notation. |
| `wikilink` | Wikilinks. |

## Layout

`DocPage` is a three-column grid: the sidebar (search, then nav), the page with breadcrumbs above and previous and next below, and the outline from `xl` up. Under `lg` the nav folds behind a Menu button. It leaves `pt-28` at the top for a fixed site header and `pb-48` below the page, and its `main` is `#main-content` with `tabindex="-1"`, ready for a skip link.

### Your own layout

To keep gruff's components but arrange them yourself, register your own layout and name it in the Vite config:

```ts [vite.config.ts]
gruff({ /* ... */, layout: 'MyDocLayout' })
```

```vue [src/MyDocLayout.vue]
<script setup lang="ts">
import type { TocEntry } from '@goatsoft/gruff'
import { DocToc, SearchDialog } from '@goatsoft/gruff/vue'

defineProps<{ frontmatter: { title?: string, toc?: TocEntry[] } }>()
</script>

<template>
  <SearchDialog />
  <article><slot /></article>
  <DocToc :entries="frontmatter.toc ?? []" />
</template>
```

Register it with `app.component('MyDocLayout', MyDocLayout)`. `layout` can also be a function of the file's path, returning a component name or `null` for no layout, so some Markdown (snippets for a landing page, say) renders bare. `useDocs()` returns the installed options inside any component.

## Icons

The built-in icons are small stroked SVGs. Pass any Vue components to use your icon set; each receives a `class`:

```ts
import IconCheck from '~icons/lucide/check'
import IconCopy from '~icons/lucide/copy'

gruffDocs({ data, nav, icons: { check: IconCheck, copy: IconCopy } })
```

The names are `check`, `copy`, `chevronDown`, `chevronLeft`, `chevronRight` and `search`. Icons you don't pass keep the built-in ones.

## Components

| Component | Props | Notes |
| --- | --- | --- |
| `DocPage` | `frontmatter` | The default layout. Uses everything below. |
| `SearchDialog` | none | The search button and dialog. ⌘K, Ctrl+K or `/` open it; arrows and Enter pick a result. The index loads on first search. |
| `DocToc` | `entries: TocEntry[]` | "On this page", highlighting the heading in view. |
| `CodeGroup` | `tabs: string[]` | Rendered by `::: code-group`. |
| `CopyButton` | `code: string` | Rendered into every code block. |
| `Term` | `id: string` | Rendered for glossary terms. Needs a glossary page at `glossaryRoute`. |

All of them need `gruffDocs()` installed; outside it they throw `gruff: the docs components need app.use(gruffDocs({ ... }))`. `SearchDialog` and `Term` use reka-ui (`DocPage` includes `SearchDialog`).
