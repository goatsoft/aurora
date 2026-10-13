# ADR-0008: gruff and the site

Status: accepted · 13 October 2026

## Context

Phase 6 puts Aurora on the web at `aurora.goatsoft.io`: a landing page, the docs, the hosted Studio and the format schema. The docs already live in the repo as Markdown, read on GitHub as much as on the site, and a background library's docs only convince if every example on them is live. The site has to be the best demo of the library itself: instant first paint, no layout shift, WebGPU taking over from CSS without a flash, and Lighthouse 100s.

## Decision

- **gruff, our own small static site generator** (`packages/gruff`, private). It is a set of Vite plugins on `unplugin-vue-markdown` (markdown-it, as VitePress uses) rather than VitePress itself, because the site is a Vue app with its own landing page, Studio and Tailwind theme, and a docs framework would own the shell. gruff adds:
  - heading anchors and the page outline, and page titles from the first heading;
  - Shiki with dual themes and `// [!code …]` notation;
  - containers (`tip`, `note`, `warning`, `danger`, `details`, `code-group` with prerendered tabs);
  - **live `aurora` fences**: the source and a running background, with links to open it in Studio;
  - repo-relative links that work on GitHub and on the site, wikilinks, and glossary terms linked from their first use;
  - `virtual:gruff`: a build-time MiniSearch index, the page list for navigation, and the glossary;
  - `prerender`, which renders every route with `vue/server-renderer` into the client build and can inline the build's CSS.
- **The docs are the repo's `docs/`.** vue-router 5 file routes pick up `docs/**/*.md` as `/docs/…`. Generator pages are generated from each generator's own definition (`packages/core/test/docs.test.ts`) and lead with the starter running live. Decision records stay in the repo for contributors and are not published.
- **Every page is static HTML.** The prerendered markup already carries each background's CSS fallback, so the first paint has the background; the client hydrates the same markup and WebGPU crossfades in after its first real frame. The site's CSS (about 10 kB gzip) is inlined so first paint needs no second request. Unknown paths get `404.html`, which is also the SPA shell for Studio's deep links.
- **One GitHub Pages site** built by `pnpm build` and deployed by `pages.yml` from `main` with `actions/deploy-pages`: `/` the landing page, `/docs`, `/studio/` (Studio built with `STUDIO_BASE=/studio/`) and `/schema/v1.json`, plus a sitemap and robots.txt. No CDN or third-party scripts.
- **Site UI** follows Studio's stack (Tailwind 4, reka-ui styled shadcn-style, Hugeicons, Inter Variable bundled with the site), but components that appear on every page avoid reka-ui so its shared chunk only loads with the docs search and glossary cards. Motion is CSS-only and honours `prefers-reduced-motion`.

## Consequences

- Lighthouse on the built site (served with gzip, as Pages does): desktop is 100/100/100/100 on the landing and docs pages. Mobile is 100 for accessibility, best practices and SEO and 93–96 for performance; its simulated first paint counts the Vue runtime and the Inter font, which are requested early. CLS stays at or below 0.01.
- Checking WebGPU on the site found a real runtime race: generators registered before the worker's probe finished were dropped, so busy pages stayed on CSS. The worker now queues them.
- gruff is private for now. Publishing it is a separate decision, once another GOATsoft site needs it.
