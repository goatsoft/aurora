import { defineConfig } from 'vite'
import { libraryConfig } from '../../vite.library.ts'

const bundlers = ['vite', 'rollup', 'rolldown', 'esbuild', 'webpack', 'rspack']

const config = libraryConfig(import.meta.dirname, {
  index: 'src/index.ts',
  ...Object.fromEntries(bundlers.map((name) => [name, `src/${name}.ts`])),
})
// A Node plugin: keep node: built-ins external.
const external = config.build!.rolldownOptions!.external as (id: string) => boolean
config.build!.rolldownOptions!.external = (id) => id.startsWith('node:') || external(id)
config.build!.target = 'node20'

export default defineConfig(config)
