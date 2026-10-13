import type { MarkdownIt, StateCore, Token } from 'markdown-it'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { headingId } from './toc'

export interface GlossaryEntry {
  /** The term's anchor on the glossary page. */
  id: string
  term: string
  definition: string
  aliases: string[]
}

/** The glossary file: one `## Term` per entry, a definition, then an optional `Aliases:` line. */
export function parseGlossary(markdown: string): GlossaryEntry[] {
  return markdown.split(/^## +/m).slice(1).map((section) => {
    const [head = '', ...rest] = section.split('\n')
    const lines = rest.map((l) => l.trim())
    const aliases = lines.find((l) => /^Aliases:/i.test(l))?.replace(/^Aliases:\s*/i, '').split(',').map((s) => s.trim()).filter(Boolean) ?? []
    return { id: headingId(head), term: head.trim(), definition: lines.filter((l) => l && !/^Aliases:/i.test(l)).join(' '), aliases }
  })
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Links the first use of each glossary term on a page to its definition: `<Term id="…">` shows it
 * on hover. Only in paragraphs and list items, never inside links, code or headings, and not on
 * the glossary page itself or pages with `glossary: false`. Longer names win ("CSS fallback"
 * before "CSS").
 */
export function glossaryLinks(md: MarkdownIt, file: string): void {
  let cache: { mtime: number, names: { id: string, re: RegExp }[] } | undefined
  const names = () => {
    const mtime = existsSync(file) ? statSync(file).mtimeMs : 0
    if (cache?.mtime !== mtime) {
      const entries = mtime ? parseGlossary(readFileSync(file, 'utf8')) : []
      cache = {
        mtime,
        names: entries.flatMap((e) => [e.term, ...e.aliases].map((name) => ({ id: e.id, name })))
          .sort((a, b) => b.name.length - a.name.length)
          .map(({ id, name }) => ({ id, re: new RegExp(`(^|[^\\w-])(${escape(name)})(?![\\w-])`) })),
      }
    }
    return cache.names
  }

  md.core.ruler.push('gruff_glossary', (state: StateCore) => {
    const env = state.env as { id?: string, frontmatter?: Record<string, unknown> }
    if (env.id === file || env.frontmatter?.['glossary'] === false) return
    const seen = new Set<string>()
    state.tokens.forEach((block, i) => {
      const parent = state.tokens[i - 1]
      if (block.type !== 'inline' || !block.children || !parent || !['paragraph_open', 'list_item_open'].includes(parent.type)) return
      let depth = 0
      block.children = block.children.flatMap((token) => {
        if (token.type === 'link_open') depth++
        if (token.type === 'link_close') depth--
        return token.type === 'text' && depth === 0 ? link(state, token, seen) : [token]
      })
    })
  })

  function link(state: StateCore, token: Token, seen: Set<string>): Token[] {
    const out: Token[] = []
    let text = token.content
    for (;;) {
      let best: { index: number, length: number, id: string } | undefined
      for (const { id, re } of names()) {
        if (seen.has(id)) continue
        const m = re.exec(text)
        if (m && (!best || m.index + m[1]!.length < best.index)) best = { index: m.index + m[1]!.length, length: m[2]!.length, id }
      }
      if (!best) break
      seen.add(best.id)
      if (best.index) out.push(Object.assign(new state.Token('text', '', 0), { content: text.slice(0, best.index) }))
      out.push(Object.assign(new state.Token('html_inline', '', 0), { content: `<Term id="${best.id}">${md.utils.escapeHtml(text.slice(best.index, best.index + best.length))}</Term>` }))
      text = text.slice(best.index + best.length)
    }
    if (!out.length) return [token]
    if (text) out.push(Object.assign(new state.Token('text', '', 0), { content: text }))
    return out
  }
}
