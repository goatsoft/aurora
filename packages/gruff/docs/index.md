---
description: gruff turns Markdown into Vue pages with Vite, and prerenders them to static HTML.
---

# gruff

gruff is a rough and ready static site generator made of Vite plugins. Markdown files become Vue components inside your own Vue app, and after `vite build` its `prerender` writes static HTML for every route. It is a library, not a framework: you keep your `index.html`, your router, your stylesheet and your layout, and gruff adds what docs need.

## How it fits together

```
docs/**/*.md ──► gruff() Vite plugins ──► Vue components (one per page)
                   │                         │
                   │ virtual:gruff           │ your router: one route per page
                   │ (search index, pages,   │
                   │  glossary)              ▼
                   └──────────────────► your app + gruffDocs() (optional UI)
                                             │
                          vite build ────────┤
                          vite build --ssr ──┤
                                             ▼
                                  prerender() → dist/**/index.html
```

1. **`gruff(options)`** returns Vite plugins. They compile each Markdown file to a Vue component wrapped in your layout, and serve `virtual:gruff`: the search index, every page's title and order, and the glossary. In dev, adding, removing or editing a page updates them without a restart.
2. **Your app** routes the pages like any other component, and can install **`gruffDocs()`** from `@goatsoft/gruff/vue` for a ready-made docs layout, search, outline and code UI.
3. **`prerender(options)`** renders every route with your server entry after the client and SSR builds, writing HTML the client then hydrates.

## Pages

- [Getting started](getting-started.md): a complete site from an empty folder to static HTML, with every file.
- [Writing pages](markdown.md): frontmatter, headings, callouts, code blocks and groups, custom fences, links, images, wikilinks and the glossary.
- [Docs components](components.md): `@goatsoft/gruff/vue`, the theme tokens and classes to style, icons, and bringing your own layout.
- [Prerendering](prerender.md): static HTML, inlined CSS, idle hydration and font subsetting.
- [API reference](api.md): every export, option and type.

## Entry points

| Import | Runs in | What it is |
| --- | --- | --- |
| `@goatsoft/gruff` | Node (Vite config, build scripts) | The Vite plugins, the markdown-it plugins they are made of, search and `prerender`. |
| `@goatsoft/gruff/vue` | The browser and SSR | `gruffDocs()`, the docs components and navigation helpers. Optional. |
| `@goatsoft/gruff/client` | TypeScript only | Types for `virtual:gruff` and `.md` imports. |

## Requirements

Node 22 or later, Vite 8, Vue 3.5 and `@vitejs/plugin-vue`. The docs components also need vue-router 5, reka-ui 2 and Tailwind 4. gruff is ESM only.
