import type { App, InjectionKey, MaybeRefOrGetter } from 'vue'
import { inject, watchEffect } from 'vue'
import { toValue } from 'vue'

export const SITE = {
  name: 'Aurora',
  url: 'https://aurora.goatsoft.io',
  repo: 'https://github.com/goatsoft/aurora',
  npm: 'https://www.npmjs.com/package/@goatsoft/aurora',
  description: 'Give your site atmosphere: beautiful backgrounds that move with you. Design one in Aurora Studio, then use it with Vue or HTML. WebGPU, with a CSS fallback.',
}

export interface Head {
  title: string
  description: string
  path: string
}

const KEY: InjectionKey<Head> = Symbol('head')

/** A tiny head manager: pages set their title and description; SSR writes them, the client keeps them in sync. */
export function createHead(app: App, path: string): Head {
  const head: Head = { title: SITE.name, description: SITE.description, path }
  app.provide(KEY, head)
  return head
}

export function useHead(meta: { title?: MaybeRefOrGetter<string | undefined>, description?: MaybeRefOrGetter<string | undefined> }): void {
  const head = inject(KEY)
  if (!head) return
  watchEffect(() => {
    const title = toValue(meta.title)
    head.title = title ? `${title} · ${SITE.name}` : `${SITE.name}: animated WebGPU backgrounds`
    head.description = toValue(meta.description) ?? SITE.description
    if (typeof document !== 'undefined') {
      document.title = head.title
      document.querySelector('meta[name="description"]')?.setAttribute('content', head.description)
    }
  })
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** The `<head>` tags for a rendered page. */
export function headTags(head: Head, assets: { favicon: string, og: string }): string {
  // GitHub Pages serves each page as a folder, at its path with a trailing slash.
  const url = `${SITE.url}${head.path.replace(/\/?$/, '/')}`
  return [
    `<title>${escape(head.title)}</title>`,
    `<meta name="description" content="${escape(head.description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<link rel="icon" type="image/svg+xml" href="${assets.favicon}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE.name}">`,
    `<meta property="og:title" content="${escape(head.title)}">`,
    `<meta property="og:description" content="${escape(head.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE.url}${assets.og}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].join('\n    ')
}
