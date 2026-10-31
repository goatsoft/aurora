<p align="center">
  <img src="https://raw.githubusercontent.com/goatsoft/aurora/main/packages/gruff/assets/gruff-mark.svg" alt="gruff" width="128" height="128">
</p>

<h1 align="center">gruff</h1>

<p align="center"><strong>The rough and ready static site generator for Vue.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/@goatsoft/gruff"><img src="https://img.shields.io/npm/v/@goatsoft/gruff?color=818cf8&label=npm" alt="npm version"></a>
  <a href="https://github.com/goatsoft/aurora/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@goatsoft/gruff?color=38bdf8" alt="MIT licence"></a>
  <img src="https://img.shields.io/badge/vite-8-c084fc" alt="Vite 8">
  <img src="https://img.shields.io/badge/vue-3.5-67e8f9" alt="Vue 3.5">
  <img src="https://img.shields.io/badge/types-included-64748b" alt="TypeScript types included">
</p>

gruff is a rough and ready static site generator: a few Vite plugins, not a framework. Your Markdown files become Vue components, so docs live inside your own Vue app, next to your landing page and your own components, instead of inside a docs framework that owns the shell. Build the site with Vite, then `prerender` writes static HTML for every route.

Like its namesake goat, it is gruff, small and gets over the bridge.

## See it in action

gruff builds the docs for two GOATsoft projects. Try the search (⌘K) and the code tabs:

- [Aurora docs](https://aurora.goatsoft.io/docs): animated WebGPU backgrounds, with live demos in the pages through a custom fence and glossary terms you can hover.
- [Lucy docs](https://lucy.goatsoft.io/docs): a UI kit and app framework for Roblox, with Luau code throughout.

## What you get

- **Markdown as Vue.** Every `.md` file is a component (via [unplugin-vue-markdown](https://github.com/unplugin/unplugin-vue-markdown)), wrapped in a layout you choose. Vue components work inside pages.
- **Code that reads well.** [Shiki](https://shiki.style) highlighting at build time in light and dark themes at once, file titles, `// [!code highlight]`, `++`/`--` and `focus` notation, copy buttons, and tabbed code groups.
- **Callouts:** `::: tip`, `note`, `warning`, `danger`, `details` and `code-group`.
- **Links that work everywhere.** The same Markdown reads on GitHub and on your site: `.md` links become routes, links to other repo files go to GitHub, `[[Wikilinks]]` work, and glossary terms link from their first use on each page, with the definition on hover.
- **Search with no server.** A build-time [MiniSearch](https://lucaong.github.io/minisearch/) index, one entry per section, so results land on the right heading.
- **Page outlines:** heading anchors and an "On this page" list for every page.
- **Static HTML.** `prerender` writes every route, inlines small CSS, starts the app when the browser is idle, and cuts fonts down to the characters your pages use.
- **Ready-made docs UI** (optional, `@goatsoft/gruff/vue`): a docs layout with sidebar, breadcrumbs, previous and next links, search dialog (⌘K), outline, code groups, copy buttons and glossary cards, styled with Tailwind 4 and shadcn-style theme tokens.

## Install

```sh
npm install -D @goatsoft/gruff vite @vitejs/plugin-vue
npm install vue vue-router
```

For the docs components, also install `reka-ui` and Tailwind 4:

```sh
npm install reka-ui
npm install -D tailwindcss @tailwindcss/vite
```

gruff is ESM only and needs Node 22 or later, Vite 8 and Vue 3.5.

## Quick start

**1. Add the plugins** in `vite.config.ts`. gruff needs to know which Markdown files are pages and their routes:

```ts [vite.config.ts]
import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { gruff } from '@goatsoft/gruff'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const root = import.meta.dirname
const docs = join(root, 'docs')

// docs/guide/setup.md → /docs/guide/setup, and a folder's index.md is the folder.
function route(file: string): string | undefined {
  if (!file.startsWith(`${docs}/`) || !file.endsWith('.md')) return undefined
  const path = relative(docs, file).replace(/\.md$/, '').replace(/(^|\/)index$/, '')
  return `/docs${path ? `/${path}` : ''}`
}

const pages = () => readdirSync(docs, { recursive: true, encoding: 'utf8' })
  .map((name) => join(docs, name))
  .flatMap((file) => (route(file) ? [{ file, route: route(file)! }] : []))

export default defineConfig({
  plugins: [
    ...gruff({ root, route, pages, repoUrl: 'https://github.com/you/your-repo/blob/main/' }),
    vue({ include: [/\.vue$/, /\.md$/] }),
    tailwindcss(),
  ],
})
```

**2. Route the pages and install the docs components** in your app:

```ts [src/main.ts]
import { gruffDocs, navGroups } from '@goatsoft/gruff/vue'
import * as data from 'virtual:gruff'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './main.css'

// Every page under docs/, by the same rule as route() in vite.config.ts.
const routes = Object.entries(import.meta.glob('/docs/**/*.md')).map(([file, page]) => ({
  path: file.replace(/\.md$/, '').replace(/\/index$/, ''),
  component: page,
}))

const nav = navGroups(data.pages, [
  { title: 'Guide', match: (route) => route === '/docs' || route.startsWith('/docs/guide/') },
  { title: 'Reference', match: (route) => route.startsWith('/docs/reference/') },
])

createApp(App)
  .use(createRouter({ history: createWebHistory(), routes }))
  .use(gruffDocs({ data, nav }))
  .mount('#app')
```

`App.vue` renders `<RouterView />`. Add `"@goatsoft/gruff/client"` to `compilerOptions.types` in `tsconfig.json` for the types of `virtual:gruff` and `.md` imports.

**3. Point Tailwind at the components** and give it the theme tokens they use (see [Docs components](https://github.com/goatsoft/aurora/blob/main/packages/gruff/docs/components.md#theme) for the full list and a starting theme):

```css [src/main.css]
@import "tailwindcss";
@source "../node_modules/@goatsoft/gruff/dist";
```

**4. Write a page:**

```md [docs/index.md]
---
description: Everything about the widget.
---

# Widget docs

::: tip
Start with [Setup](guide/setup.md).
:::
```

Run `vite` and open `/docs`.

## Learn more

The [docs](https://github.com/goatsoft/aurora/blob/main/packages/gruff/docs/index.md) cover everything gruff does:

- [Getting started](https://github.com/goatsoft/aurora/blob/main/packages/gruff/docs/getting-started.md): a complete site, from an empty folder to static HTML.
- [Writing pages](https://github.com/goatsoft/aurora/blob/main/packages/gruff/docs/markdown.md): frontmatter, callouts, code, links, wikilinks and the glossary.
- [Docs components](https://github.com/goatsoft/aurora/blob/main/packages/gruff/docs/components.md): `@goatsoft/gruff/vue`, its theme tokens, icons and your own layout.
- [Prerendering](https://github.com/goatsoft/aurora/blob/main/packages/gruff/docs/prerender.md): static HTML, idle hydration and font subsetting.
- [API reference](https://github.com/goatsoft/aurora/blob/main/packages/gruff/docs/api.md): every export and option.

## Licence

MIT, by [GOATsoft](https://goatsoft.io). gruff lives in the [Aurora repository](https://github.com/goatsoft/aurora/tree/main/packages/gruff); issues and pull requests are welcome there.
