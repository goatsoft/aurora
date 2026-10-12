import type { MarkdownIt } from 'markdown-it'
import anchor from 'markdown-it-anchor'

export interface TocEntry {
  id: string
  text: string
  level: number
}

/** GitHub's heading ids: lowercase, punctuation dropped, spaces to hyphens. */
export function headingId(text: string): string {
  return text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-')
}

/**
 * Heading anchors (`#` links you can copy, ids as GitHub makes them), and the page's `##`/`###`
 * outline exported as `frontmatter.toc`, so the layout can show "On this page". The first `#`
 * heading becomes `frontmatter.title` when the page doesn't set one.
 */
export function toc(md: MarkdownIt): void {
  md.use(anchor, {
    slugify: headingId,
    permalink: anchor.permalink.linkInsideHeader({ symbol: '#', placement: 'before', class: 'heading-anchor', ariaHidden: true, renderAttrs: () => ({ tabindex: '-1' }) }),
  })
  md.core.ruler.push('gruff_toc', (state) => {
    const env = state.env as { frontmatter?: Record<string, unknown> }
    const frontmatter = (env.frontmatter ??= {})
    const entries: TocEntry[] = []
    state.tokens.forEach((token, i) => {
      if (token.type !== 'heading_open') return
      const level = Number(token.tag.slice(1))
      const text = (state.tokens[i + 1]?.children ?? []).filter((t) => t.type === 'text' || t.type === 'code_inline').map((t) => t.content).join('').trim()
      if (level === 1 && frontmatter['title'] === undefined) frontmatter['title'] = text
      if (level === 2 || level === 3) entries.push({ id: String(token.attrGet('id') ?? headingId(text)), text, level })
    })
    frontmatter['toc'] = entries
  })
}
