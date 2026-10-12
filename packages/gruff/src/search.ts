import type { Options } from 'minisearch'
import { readFileSync } from 'node:fs'
import matter from 'gray-matter'
import MiniSearch from 'minisearch'

export interface SearchDocument {
  id: string
  title: string
  section: string
  text: string
}

/** Markdown to searchable text: no code, no markup, headings kept. */
function plain(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#|:-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The index options; the client loads the index with the same ones. */
export const SEARCH_FIELDS: Options<SearchDocument> = { fields: ['title', 'section', 'text'], storeFields: ['title', 'section'] }

export interface PageInfo {
  route: string
  title: string
  description: string | undefined
  /** Frontmatter `order`, for sorting navigation; pages without one sort after, by title. */
  order: number | undefined
}

/** A page's title (frontmatter, else its first `#` heading as plain text, else its route) and description. */
export function pageInfo(file: string, route: string): PageInfo {
  const { content, data } = matter(readFileSync(file, 'utf8'))
  const meta = data as { title?: string, description?: string, order?: number }
  const heading = /^#\s+(.+)$/m.exec(content)?.[1]?.replace(/[`*_]/g, '').trim()
  return { route, title: meta.title ?? heading ?? route, description: meta.description, order: meta.order }
}

/**
 * A build-time MiniSearch index of the docs, one document per `##` section, so results land on
 * the right heading. The client loads it as JSON: no server, no runtime Markdown.
 */
export function buildSearchIndex(pages: { file: string, route: string }[]): string {
  const docs: SearchDocument[] = []
  for (const { file, route } of pages) {
    const { content, data } = matter(readFileSync(file, 'utf8'))
    if ((data as { search?: boolean }).search === false) continue
    const { title } = pageInfo(file, route)
    const parts = content.split(/^##\s+/m)
    docs.push({ id: route, title, section: '', text: plain(parts[0] ?? '') })
    for (const part of parts.slice(1)) {
      const [heading = '', ...body] = part.split('\n')
      const id = `${route}#${heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-')}`
      docs.push({ id, title, section: heading.trim(), text: plain(body.join('\n')) })
    }
  }
  const index = new MiniSearch<SearchDocument>(SEARCH_FIELDS)
  index.addAll(docs)
  return JSON.stringify(index)
}
