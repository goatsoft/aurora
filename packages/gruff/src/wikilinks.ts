import type { MarkdownIt } from 'markdown-it'

/** A page name as a route segment: `Getting Started` → `getting-started`. */
export function slugify(page: string): string {
  return page.trim().toLowerCase().replace(/[^a-z\d_.]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * GitHub-wiki style links: `[[Page]]` and `[[Link text|Page]]`, with an optional `#anchor`.
 * `base` is the route prefix the pages live under (for example `/docs/`).
 */
export function wikilinks(md: MarkdownIt, base = '/docs/'): void {
  md.inline.ruler.before('link', 'wikilink', (state, silent) => {
    const { src, pos } = state
    if (src.charCodeAt(pos) !== 0x5b || src.charCodeAt(pos + 1) !== 0x5b) return false
    const end = src.indexOf(']]', pos + 2)
    if (end < 0) return false
    const body = src.slice(pos + 2, end)
    if (!body.trim() || body.includes('\n') || body.includes('[')) return false
    if (!silent) {
      const [first, second] = body.split('|', 2)
      const label = first!.trim()
      const [name, anchor] = (second ?? first)!.trim().split('#', 2)
      const href = `${base}${slugify(name!)}${anchor ? `#${slugify(anchor)}` : ''}`
      const open = state.push('link_open', 'a', 1)
      open.attrs = [['href', href], ['class', 'wikilink']]
      state.push('text', '', 0).content = label
      state.push('link_close', 'a', -1)
    }
    state.pos = end + 2
    return true
  })
}
