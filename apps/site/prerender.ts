import type { RenderResult } from '@goatsoft/gruff'
import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { prerender } from '@goatsoft/gruff'
import { SITE } from './src/head.ts'

// After `vite build` (client) and `vite build --ssr` (dist-server): static HTML for every route.
const here = import.meta.dirname
const server = readdirSync(join(here, 'dist-server')).find((f) => /^entry-server\.m?js$/.test(f))!
const entry = await import(pathToFileURL(join(here, 'dist-server', server)).href) as {
  render: (url: string) => Promise<RenderResult>
  routes: Route[]
}

interface Route { path: string, component?: unknown, children?: Route[] }

function paths(list: typeof entry.routes, base = ''): string[] {
  return list.flatMap((r) => {
    const path = r.path.startsWith('/') ? r.path : `${base}/${r.path}`.replace(/\/+/g, '/')
    // Folders without a page of their own (docs/guide) are only parents of routes.
    const own = path.includes(':') || !r.component ? [] : [path.replace(/\/$/, '') || '/']
    return [...own, ...paths(r.children ?? [], path)]
  })
}

// The 404 page is written once, as 404.html, which GitHub Pages serves for unknown paths.
const routes = [...new Set(paths(entry.routes))].filter((path) => path !== '/404')
// The CSS is small (about 10 kB gzip), so it rides in the HTML instead of blocking first paint.
// The pages read fine before Vue starts, so the JavaScript waits until after first paint, and
// Inter is cut down to the characters and weights (400 to 700) the site uses.
const files = await prerender({
  outDir: join(here, 'dist'),
  routes,
  render: entry.render,
  notFound: '/404',
  inlineCss: true,
  hydrate: 'idle',
  subsetFonts: { axes: { wght: { min: 400, max: 700 } } },
})

// Every page, for search engines (robots.txt points here).
const urls = routes.map((path) => `  <url><loc>${SITE.url}${path === '/' ? '/' : `${path}/`}</loc></url>`)
writeFileSync(join(here, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
console.log(`Prerendered ${files.length} pages and the sitemap.`)
