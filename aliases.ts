import type { Alias, Plugin } from 'vite'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { searchForWorkspaceRoot } from 'vite'

/** The repository root, found from wherever this runs (no `../` counting). */
export const ROOT = searchForWorkspaceRoot(process.cwd())

/** `~/presets/classic/hero.aurora` → `<repo>/presets/classic/hero.aurora`. Works in imports and `import.meta.glob`. */
export const rootAlias: Alias = { find: /^~\//, replacement: `${ROOT}/` }

function packageRoot(file: string): string | undefined {
  for (let dir = dirname(file); dir !== dirname(dir); dir = dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) return dir
  }
  return undefined
}

/** `@/renderer` → the importing package's `src/renderer`, mirroring each tsconfig's `paths`. */
export function packageSrcAlias(): Plugin {
  return {
    name: 'aurora:package-src-alias',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!source.startsWith('@/') || !importer) return null
      const root = packageRoot(importer.replace(/[?#].*$/, ''))
      if (!root) return null
      return this.resolve(join(root, 'src', source.slice(2)), importer, { ...options, skipSelf: true })
    },
  }
}
