import type { Plugin } from 'vite'
import { createCodeHighlighter } from '@goatsoft/gruff'
import { badgeSnippet } from './src/lib/badge-snippet'

/** Highlight every selectable snippet at build time; no Shiki runtime reaches the browser. */
export function badgeSnippets(): Plugin {
  const id = 'virtual:badge-snippets'
  return {
    name: 'aurora-badge-snippets',
    resolveId(source) {
      if (source === id) return `\0${id}`
    },
    async load(source) {
      if (source !== `\0${id}`) return
      const highlight = await createCodeHighlighter({ langs: ['vue', 'html', 'md'] })
      const snippets: Record<string, string> = {}
      for (const label of ['made-with', 'powered-by', 'enabled'] as const) {
        for (const layout of ['inline', 'stacked'] as const) {
          for (const theme of ['auto', 'light', 'dark'] as const) {
            for (const animated of [false, true]) {
              const variants = badgeSnippet({ label, layout, theme, animated })
              snippets[variants.Vue] = highlight(variants.Vue, 'vue')
              snippets[variants.HTML] = highlight(variants.HTML, 'html')
              snippets[variants.Markdown] = highlight(variants.Markdown, 'md')
            }
          }
        }
      }
      return `export default ${JSON.stringify(snippets)}`
    },
  }
}
