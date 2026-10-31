---
description: A complete gruff site, from an empty folder to static HTML, with every file.
order: 1
---

# Getting started

This page builds a small docs site with gruff's docs components, server rendering and prerendered HTML. Every file is here in full, so you can copy them in order. The finished project:

```
my-docs/
  docs/
    index.md
    glossary.md
    guide/setup.md
  src/
    App.vue
    app.ts
    entry-client.ts
    entry-server.ts
    main.css
  index.html
  package.json
  prerender.js
  tsconfig.json
  vite.config.ts
```

## Install

```sh
npm init -y
npm pkg set type=module
npm install vue vue-router reka-ui
npm install -D @goatsoft/gruff vite @vitejs/plugin-vue tailwindcss @tailwindcss/vite typescript vue-tsc
```

Add the scripts. The build is three steps: the client bundle, a server bundle of the same app, then `prerender.js`, which renders every route with the server bundle into the client's `dist/`.

```json [package.json]
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && vite build --ssr src/entry-server.ts --outDir dist-server && node prerender.js",
    "preview": "vite preview"
  }
}
```

## Configure Vite

gruff needs to know three things: where the repository root is, which Markdown files are pages (and their routes), and where links to other files should go. Here every `.md` under `docs/` is a page, `docs/guide/setup.md` is `/docs/guide/setup`, and a folder's `index.md` is the folder's own route.

```ts [vite.config.ts]
import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { gruff } from '@goatsoft/gruff'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const root = import.meta.dirname
const docs = join(root, 'docs')

/** A Markdown file's route, or undefined when it isn't a page. */
function route(file: string): string | undefined {
  if (!file.startsWith(`${docs}/`) || !file.endsWith('.md')) return undefined
  const path = relative(docs, file).replace(/\.md$/, '').replace(/(^|\/)index$/, '')
  return `/docs${path ? `/${path}` : ''}`
}

/** Every page, for search and navigation. Called again whenever pages are added or removed. */
function pages() {
  return readdirSync(docs, { recursive: true, encoding: 'utf8' })
    .map((name) => join(docs, name))
    .flatMap((file) => {
      const path = route(file)
      return path ? [{ file, route: path }] : []
    })
}

export default defineConfig({
  plugins: [
    ...gruff({
      root,
      route,
      pages,
      repoUrl: 'https://github.com/you/my-docs/blob/main/',
      glossary: join(docs, 'glossary.md'),
    }),
    // Markdown pages are Vue components, so the Vue plugin compiles them too.
    vue({ include: [/\.vue$/, /\.md$/] }),
    tailwindcss(),
  ],
})
```

The `gruff()` plugins must come before `vue()`.

## TypeScript

`@goatsoft/gruff/client` declares `virtual:gruff` and `.md` imports.

```json [tsconfig.json]
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "types": ["node", "vite/client", "@goatsoft/gruff/client"]
  },
  "include": ["src", "src/**/*.vue", "vite.config.ts"]
}
```

## The HTML template

`prerender` replaces `<!--head-->` with the page's head tags and `<!--app-->` with its HTML. Both comments are required.

```html [index.html]
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--head-->
  </head>
  <body>
    <div id="app"><!--app--></div>
    <script type="module" src="/src/entry-client.ts"></script>
  </body>
</html>
```

## The app

One function creates the app for both the browser and the prerender, so the HTML the server writes is the HTML the client hydrates. The routes come from the same files gruff compiles: `import.meta.glob` keys are paths from the project root (`/docs/guide/setup.md`), which map to routes by the same rule as `route()` in the Vite config.

```ts [src/app.ts]
import { gruffDocs, navGroups } from '@goatsoft/gruff/vue'
import * as data from 'virtual:gruff'
import { createSSRApp, watchEffect } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './main.css'

export const routes = Object.entries(import.meta.glob('/docs/**/*.md')).map(([file, page]) => ({
  path: file.replace(/\.md$/, '').replace(/\/index$/, ''),
  component: page,
}))

/** The sidebar: each group's pages sorted by frontmatter `order`, then route. */
const nav = navGroups(data.pages, [
  { title: 'Start', match: (route) => route === '/docs' || route.startsWith('/docs/guide/') },
  { title: 'Reference', match: (route) => route === '/docs/glossary' },
])

export function createSite() {
  const head = { title: 'My docs', description: '' }
  const app = createSSRApp(App)
  const router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes,
    scrollBehavior: (to) => (to.hash ? { el: to.hash, top: 96 } : { top: 0 }),
  })
  app.use(router)
  app.use(gruffDocs({
    data,
    nav,
    // Each page passes its title and description here as it sets up.
    useHead: ({ title, description }) => watchEffect(() => {
      head.title = title() ? `${title()} · My docs` : 'My docs'
      head.description = description() ?? ''
      if (!import.meta.env.SSR) document.title = head.title
    }),
  }))
  return { app, router, head }
}
```

```vue [src/App.vue]
<template>
  <RouterView />
</template>
```

```ts [src/entry-client.ts]
import { createSite } from './app'

const { app, router } = createSite()
void router.isReady().then(() => app.mount('#app'))
```

```ts [src/entry-server.ts]
import { renderToString } from 'vue/server-renderer'
import { createSite, routes } from './app'

/** Every route, for prerender.js. */
export const paths = routes.map((route) => route.path)

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** One route's HTML and head tags. */
export async function render(url: string) {
  const { app, router, head } = createSite()
  await router.push(url)
  await router.isReady()
  const html = await renderToString(app)
  return { html, head: `<title>${escape(head.title)}</title>\n<meta name="description" content="${escape(head.description)}">` }
}
```

## Prerender

```js [prerender.js]
import { prerender } from '@goatsoft/gruff'

const { paths, render } = await import('./dist-server/entry-server.js')
const files = await prerender({ outDir: 'dist', routes: paths, render, inlineCss: true })
console.log(`Prerendered ${files.length} pages.`)
```

`/docs/guide/setup` is written to `dist/docs/guide/setup/index.html`, which any static host serves at that path. See [Prerendering](prerender.md) for idle hydration, a 404 page and font subsetting.

## Styles

The docs components use Tailwind classes and a handful of theme tokens; gruff's Markdown output uses a few plain class names (`.prose`, `.callout`, `.code-block`). This stylesheet covers both, in one dark theme. [Docs components](components.md#theme) lists what each token is for.

```css [src/main.css]
@import "tailwindcss";
/* The docs components' classes, so Tailwind generates them. */
@source "../node_modules/@goatsoft/gruff/dist";

:root {
  color-scheme: dark;
  --background: oklch(0.15 0.02 270);
  --surface: oklch(0.2 0.02 270);
  --foreground: oklch(0.95 0.01 270);
  --muted-foreground: oklch(0.72 0.02 270);
  --border: oklch(0.75 0.03 270 / 0.15);
  --primary: oklch(0.78 0.13 230);
  --ring: oklch(0.78 0.13 230);
  --spectrum-1: oklch(0.82 0.13 200);
  --spectrum-2: oklch(0.7 0.16 290);
}

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-foreground: var(--foreground);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-primary: var(--primary);
  --color-ring: var(--ring);
  --color-spectrum-1: var(--spectrum-1);
  --color-spectrum-2: var(--spectrum-2);
}

/* Floating panels: the search dialog and glossary cards. */
@utility glass {
  background: color-mix(in oklab, var(--surface) 95%, transparent);
  backdrop-filter: blur(18px);
  border: 1px solid var(--border);
}

@layer base {
  body { @apply bg-background text-foreground antialiased; }
}

/* gruff's Markdown output. */
@layer components {
  .prose { @apply text-[15px] leading-7; }
  .prose h1 { @apply mb-6 text-4xl font-semibold tracking-tight; }
  .prose h2 { @apply mt-12 mb-4 scroll-mt-24 border-t border-border pt-8 text-2xl font-semibold; }
  .prose h3 { @apply mt-8 mb-3 scroll-mt-24 text-lg font-semibold; }
  .prose p, .prose ul, .prose ol { @apply my-4; }
  .prose ul { @apply list-disc pl-6; }
  .prose ol { @apply list-decimal pl-6; }
  .prose a { @apply text-primary underline underline-offset-4; }
  .prose :not(pre) > code { @apply rounded-md bg-surface px-1.5 py-0.5 font-mono text-[0.85em]; }
  .prose .heading-anchor { @apply absolute -ml-6 text-transparent no-underline; }
  .prose :is(h2, h3):hover .heading-anchor { @apply text-muted-foreground; }
  .prose .callout { @apply my-6 rounded-xl border border-border bg-surface/60 px-4 py-3; }
  .prose .callout-title { @apply mb-1 text-sm font-semibold; }
  .prose .callout-warning { @apply border-amber-400/40; }
  .prose .callout-danger { @apply border-rose-400/40; }
  .prose .code-block { @apply relative my-6 overflow-hidden rounded-xl border border-border bg-black/30; }
  .prose .code-title { @apply border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground; }
  .prose .code-block pre { @apply overflow-x-auto p-4 font-mono text-[13px] leading-6; }
}

/* Shiki writes both themes' colours; this site shows the dark one. */
.shiki, .shiki span { color: var(--shiki-dark); background-color: transparent !important; }
.shiki .line.highlighted { @apply -mx-4 inline-block w-[calc(100%+2rem)] bg-spectrum-2/15 px-4; }
```

The `@source` path is relative to the stylesheet: from `src/main.css`, `../node_modules` is the project's.

## Pages

```md [docs/index.md]
---
description: Everything about the widget.
order: 0
---

# My docs

Welcome. Start with [Setup](guide/setup.md).

::: tip
Every page here is a Vue component. <span style="color: hotpink">HTML works too.</span>
:::
```

````md [docs/guide/setup.md]
---
description: Install the widget.
order: 1
---

# Setup

## Install

::: code-group

```sh [npm]
npm install widget
```

```sh [pnpm]
pnpm add widget
```

:::

## Use it

Call `widget()` once. The first Widget on a page links to the glossary.
````

```md [docs/glossary.md]
# Glossary

## Widget

The thing these docs are about.

Aliases: widgets
```

## Run it

```sh
npm run dev      # http://localhost:5173/docs
npm run build    # dist/, ready for any static host
npm run preview  # serve dist/ locally
```

Next: [Writing pages](markdown.md) for everything Markdown can do here.
