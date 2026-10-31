---
description: Static HTML for every route - inlined CSS, idle hydration and font subsetting.
order: 4
---

# Prerendering

`prerender` turns a built Vue app into static HTML: one `index.html` per route, which the client then hydrates. Run it after two builds of the same app, the client build and a server (SSR) build:

```sh
vite build                                                    # dist/
vite build --ssr src/entry-server.ts --outDir dist-server     # dist-server/
node prerender.js                                             # dist/**/index.html
```

## The server entry

The server build needs one function, `render(url)`, that renders a route and returns its HTML:

```ts [src/entry-server.ts]
import { renderToString } from 'vue/server-renderer'
import { createSite } from './app'

export async function render(url: string) {
  const { app, router, head } = createSite()
  await router.push(url)
  await router.isReady()
  return {
    html: await renderToString(app),
    head: `<title>${head.title}</title>`,
    htmlAttrs: 'lang="en"',
  }
}
```

- `html` replaces `<!--app-->` in the template.
- `head` replaces `<!--head-->`: title, description, canonical link, Open Graph tags, whatever the page needs. Escape what you interpolate.
- `htmlAttrs` (optional) is added to `<html>`, replacing attributes of the same name.

The template is the client build's `dist/index.html`, so it must contain `<!--head-->` in `<head>` and `<!--app-->` inside the element the app mounts on. `prerender` throws if either is missing.

## Options

```js [prerender.js]
import { prerender } from '@goatsoft/gruff'

const { paths, render } = await import('./dist-server/entry-server.js')

await prerender({
  outDir: 'dist',
  routes: paths,
  render,
  notFound: '/404',
  inlineCss: true,
  hydrate: 'idle',
  subsetFonts: { axes: { wght: { min: 400, max: 700 } } },
})
```

| Option | Default | What it does |
| --- | --- | --- |
| `outDir` | required | The client build's folder. Its `index.html` is the template; pages are written beside it. |
| `routes` | required | Every route to write. `/docs/guide` is written to `docs/guide/index.html`. |
| `render` | required | Your server entry's `render(url)`. |
| `notFound` | none | Also render this route to `404.html`, which static hosts such as GitHub Pages serve for unknown paths (and which can be a single-page app's fallback). |
| `inlineCss` | `false` | Replace the build's own stylesheet links with `<style>` tags, so the first paint needs no second request. Worth it while the CSS is small (tens of kB). |
| `hydrate` | `'eager'` | `'idle'` starts the app after the page has painted (see below). |
| `subsetFonts` | `false` | Cut every `.woff2` the pages use down to their characters (see below). |

`prerender` returns the paths of the files it wrote.

### Listing routes

The routes are yours to list. With the `import.meta.glob` routes from [Getting started](getting-started.md#the-app), export their paths from the server entry. With file-based routing (vue-router's `vue-router/auto-routes`), export the route records and walk them, skipping dynamic segments (`:id`) and folders that have no page of their own.

## Idle hydration

With `hydrate: 'idle'`, the prerendered page shows and works (links are links, text is selectable) before any JavaScript runs. The build's module script and its preloads are replaced by a small inline loader that imports the app when the page has loaded and the browser is idle, or at the first pointer, key, focus or wheel event, whichever comes first.

A button pressed before the app is live would do nothing, so the loader remembers the first button clicked and clicks it again once the app says it is ready. Dispatch `gruff:hydrated` after mounting:

```ts [src/entry-client.ts]
const { app, router } = createSite()
void router.isReady().then(() => {
  app.mount('#app')
  dispatchEvent(new Event('gruff:hydrated'))
})
```

The template must have exactly one module script for the app. A script marked `data-eager` is left alone and starts at once, which suits work that shouldn't wait for the app (warming up a WebGL or WebGPU hero, say):

```html
<script type="module" src="/src/warm.ts" data-eager></script>
```

## Font subsetting

`subsetFonts: true` collects every character the prerendered pages contain, adds printable ASCII (for text that appears later, such as search results), and rewrites each `.woff2` referenced by the pages or the build's CSS to just those characters, under a new hashed name. A variable font can also be narrowed on its axes:

```js
subsetFonts: { axes: { wght: { min: 400, max: 700 } } }
```

On aurora.goatsoft.io, with the weight axis narrowed to 400-700, Inter Variable latin drops from 47 kB to 20 kB. Text the pages never show (from an API, say) falls back to the next font in the stack, so keep subsetting for sites whose text is in the HTML.

## Hosting

The output is plain files. Any static host works; for clean URLs, the host must serve `docs/guide/index.html` at `/docs/guide/` (GitHub Pages, Netlify, Cloudflare Pages and most others do). Link to pages with a trailing slash (`/docs/guide/`) to avoid a redirect on hosts that add one.
