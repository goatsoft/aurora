// For tools that don't understand .vue files (typescript-eslint). vue-tsc reads the real types.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent
  export default component
}

declare module 'virtual:gruff' {
  import type { GlossaryEntry, PageInfo, SearchDocument } from '@goatsoft/gruff'
  import type { Options } from 'minisearch'

  /** The docs' MiniSearch index, serialised; load it with `searchFields`. */
  export const searchIndex: string
  export const searchFields: Options<SearchDocument>
  export const pages: PageInfo[]
  export const glossary: GlossaryEntry[]
}

declare module '*.md' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent
  export default component
}

declare module 'virtual:badge-snippets' {
  const highlights: Record<string, string>
  export default highlights
}
