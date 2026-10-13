import type { MarkdownIt, Token } from 'markdown-it'
import container from 'markdown-it-container'
import { parseInfo } from './highlight'

const KINDS = { tip: 'Tip', note: 'Note', warning: 'Warning', danger: 'Danger' } as const

/**
 * Custom blocks:
 *   ::: tip Optional title      (also note, warning, danger)
 *   ::: details Summary text
 *   ::: code-group               (fences inside become tabs, labelled by their [title])
 *
 * A code group passes its tab labels to `<CodeGroup :tabs>`, so they are in the prerendered HTML.
 */
export function containers(md: MarkdownIt): void {
  const use = container as unknown as (md: MarkdownIt, name: string, options: object) => void
  for (const [name, label] of Object.entries(KINDS)) {
    use(md, name, {
      render(tokens: { info: string, nesting: number }[], idx: number) {
        const token = tokens[idx]!
        if (token.nesting !== 1) return '</div>\n'
        const title = token.info.trim().slice(name.length).trim() || label
        return `<div class="callout callout-${name}" role="note"><p class="callout-title">${md.utils.escapeHtml(title)}</p>\n`
      },
    })
  }
  use(md, 'details', {
    render(tokens: { info: string, nesting: number }[], idx: number) {
      const token = tokens[idx]!
      if (token.nesting !== 1) return '</details>\n'
      const summary = token.info.trim().slice('details'.length).trim() || 'Details'
      return `<details class="callout callout-details"><summary>${md.utils.escapeHtml(summary)}</summary>\n`
    },
  })
  use(md, 'code-group', {
    render(tokens: Token[], idx: number) {
      if (tokens[idx]!.nesting !== 1) return '</CodeGroup>\n'
      const tabs: string[] = []
      for (let i = idx + 1; i < tokens.length && tokens[i]!.type !== 'container_code-group_close'; i++) {
        const token = tokens[i]!
        if (token.type === 'fence') tabs.push(parseInfo(token.info).title ?? parseInfo(token.info).lang)
      }
      return `<CodeGroup :tabs='${md.utils.escapeHtml(JSON.stringify(tabs)).replace(/'/g, '&#39;')}'>\n`
    },
  })
}
