/** Types for `virtual:gruff` and Markdown pages. Add "@goatsoft/gruff/client" to tsconfig `types`. */
declare module 'virtual:gruff' {
  import type { GlossaryEntry, PageInfo, SearchDocument } from '@goatsoft/gruff'
  import type { Options } from 'minisearch'

  /** The docs' MiniSearch index, serialised; load it with `searchFields`. */
  export const searchIndex: string
  export const searchFields: Options<SearchDocument>
  /** Every page's route, title, description, order and sidebar title. */
  export const pages: PageInfo[]
  /** The glossary's entries, or none without a glossary file. */
  export const glossary: GlossaryEntry[]
}

declare module '*.md' {
  import type { DefineComponent } from 'vue'

  const page: DefineComponent
  export default page
}
