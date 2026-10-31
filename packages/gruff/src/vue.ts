import type { DocsOptions } from './docs'
import type { Plugin } from 'vue'
import CodeGroup from './CodeGroup.vue'
import CopyButton from './CopyButton.vue'
import DocPage from './DocPage.vue'
import { DOCS, resolveDocs } from './docs'
import Term from './Term.vue'

/**
 * The docs components, styled with Tailwind 4 and shadcn-style theme tokens (`border`, `surface`,
 * `muted-foreground`, `primary`, `ring`, `spectrum-1`, `spectrum-2` and a `glass` utility): add
 * `@source` for this package's `dist` to the site's stylesheet so Tailwind generates their classes.
 *
 * `app.use(gruffDocs({ ... }))` provides the site's navigation and data and registers the
 * components gruff's pages use by name: `DocPage` (the default layout), `CopyButton`,
 * `CodeGroup` and `Term`.
 */
export function gruffDocs(options: DocsOptions): Plugin {
  return {
    install(app) {
      app.provide(DOCS, resolveDocs(options))
      app.component('DocPage', DocPage)
      app.component('CopyButton', CopyButton)
      app.component('CodeGroup', CodeGroup)
      app.component('Term', Term)
    },
  }
}

export { default as CodeGroup } from './CodeGroup.vue'
export { default as CopyButton } from './CopyButton.vue'
export { default as DocPage } from './DocPage.vue'
export { breadcrumbTrail, DOCS, navGroups, useDocs } from './docs'
export type { Crumb, Docs, DocsIcon, DocsOptions, NavGroup } from './docs'
export { default as DocToc } from './DocToc.vue'
export { defaultIcons } from './icons'
export { default as SearchDialog } from './SearchDialog.vue'
export { default as Term } from './Term.vue'
