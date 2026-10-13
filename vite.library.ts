import type { UserConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

interface Manifest {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  exports: Record<string, { '@goatsoft/source'?: string, 'import'?: string }>
}

/**
/* package: ESM only, dependencies and Node built-ins external.
 * Entries come from the package's `exports` (each `@goatsoft/source` → its `import` file), so
 * adding an export is the only step to add an entry.
 */
export function libraryConfig(root: string): UserConfig {
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as Manifest
  const external = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })
  const entries = Object.fromEntries(Object.values(manifest.exports).flatMap((target) => {
    const source = target['@goatsoft/source']
    return source && target.import ? [[basename(target.import, '.js'), resolve(root, source)]] : []
  }))

  return {
    root,
    // Emitted assets (core's worker) are referenced relative to the chunk that uses them:
    // `new URL('assets/worker-….js', import.meta.url)`. The default base ('/') would point at the
    // root of the consuming site, where the file isn't.
    base: './',
    // Packages built on Vue ship single-file components.
    plugins: manifest.peerDependencies?.['vue'] ? [vue()] : [],
    build: {
      target: 'es2023',
      sourcemap: true,
      emptyOutDir: true,
      lib: { entry: entries, formats: ['es'], fileName: (_, name) => `${name}.js` },
      rolldownOptions: {
        external: (id) => id.startsWith('node:') || external.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      },
    },
  }
}

/** Run from a package directory: `vite build --config <repo>/vite.library.ts`. */
export default defineConfig(() => libraryConfig(process.cwd()))
