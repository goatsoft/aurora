import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { slugify, wikilinks } from '@/index'

const md = new MarkdownIt().use(wikilinks)

describe('wikilinks', () => {
  it('links [[Page]] and [[Text|Page#anchor]] under the docs base', () => {
    expect(md.renderInline('See [[Getting Started]].')).toBe('See <a href="/docs/getting-started" class="wikilink">Getting Started</a>.')
    expect(md.renderInline('[[the format|Format reference#Layers]]')).toBe('<a href="/docs/format-reference#layers" class="wikilink">the format</a>')
  })

  it('leaves anything that isn\'t a wikilink alone', () => {
    expect(md.renderInline('[[ ]] and [[a\nb]] and [[unclosed')).toBe('[[ ]] and [[a\nb]] and [[unclosed')
    expect(md.renderInline('[[a [b]]')).toBe('[[a [b]]')
  })

  it('slugifies page names for routes', () => {
    expect(slugify('  Aurora Studio: dev-tool mode ')).toBe('aurora-studio-dev-tool-mode')
  })
})
