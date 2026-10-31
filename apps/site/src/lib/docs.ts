import type { DocsOptions } from '@goatsoft/gruff/vue'
import { navGroups } from '@goatsoft/gruff/vue'
import IconChevronDown from '~icons/hugeicons/arrow-down-01'
import IconChevronLeft from '~icons/hugeicons/arrow-left-01'
import IconChevronRight from '~icons/hugeicons/arrow-right-01'
import IconCopy from '~icons/hugeicons/copy-01'
import IconSearch from '~icons/hugeicons/search-01'
import IconCheck from '~icons/hugeicons/tick-02'
import { useHead } from '@/head'
import * as data from 'virtual:gruff'

/** The docs sidebar: groups by folder, each sorted by frontmatter `order`, then route. */
export const nav = navGroups(data.pages, [
  { title: 'Get started', match: (r) => r === '/docs' || r.startsWith('/docs/guide/') },
  { title: 'Studio', match: (r) => r === '/docs/studio' || r.startsWith('/docs/studio/') },
  { title: 'Generators', match: (r) => r.startsWith('/docs/generators') },
  { title: 'Reference', match: (r) => r.startsWith('/docs/reference/') || r === '/docs/glossary' },
])

/** What the site gives gruff's docs components (`app.use(gruffDocs(docs))`). */
export const docs: DocsOptions = {
  data,
  nav,
  useHead,
  searchHint: 'Guides, generators, the format and every decision.',
  icons: { check: IconCheck, copy: IconCopy, chevronDown: IconChevronDown, chevronLeft: IconChevronLeft, chevronRight: IconChevronRight, search: IconSearch },
}
