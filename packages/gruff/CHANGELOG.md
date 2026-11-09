# @goatsoft/gruff

## 0.1.1

### Patch Changes

- 65d6ad1: DocPage maintains the docs sidebar scroll position across navigation, restores it from history state on back/forward and sessionStorage on reload, and scrolls the active page link into view near the top of the sidebar when navigating to a new section.

## 0.1.0

### Minor Changes

- b9d0d95: First public release. gruff turns Markdown into Vue pages with Vite and prerenders them to static HTML.
  
  - `@goatsoft/gruff/vue`: the docs components (`DocPage`, `DocToc`, `SearchDialog`, `CodeGroup`, `CopyButton`, `Term`) and `gruffDocs()`, styled with Tailwind 4 and shadcn-style theme tokens.
  - `@goatsoft/gruff/client`: types for `virtual:gruff` and `.md` imports.
  - `highlight.fences` renders chosen fence languages your own way (live demos and the like).
  - Pages get a `sidebarTitle` frontmatter field, and the dev server picks up added, removed and edited pages without a restart.
  - Highlights TOML, Luau and Lua out of the box, alongside the web languages and WGSL.
