import type { PageInfo } from '@goatsoft/gruff'
import { pages } from 'virtual:gruff'

export interface NavGroup {
  title: string
  items: PageInfo[]
}

/** The docs sidebar: groups by folder, each sorted by frontmatter `order`, then title. */
const GROUPS: { title: string, match: (route: string) => boolean }[] = [
  { title: 'Get started', match: (r) => r === '/docs' || r.startsWith('/docs/guide/') },
  { title: 'Studio', match: (r) => r === '/docs/studio' || r.startsWith('/docs/studio/') },
  { title: 'Generators', match: (r) => r.startsWith('/docs/generators') },
  { title: 'Reference', match: (r) => r.startsWith('/docs/reference/') || r === '/docs/glossary' },
]

const byOrder = (a: PageInfo, b: PageInfo) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.route.localeCompare(b.route)

export const nav: NavGroup[] = GROUPS.map(({ title, match }) => ({ title, items: pages.filter((p) => match(p.route)).sort(byOrder) }))
  .filter((group) => group.items.length)

/** Every page in sidebar order, for previous / next links. */
export const sequence = nav.flatMap((group) => group.items)
