import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { UserConfig } from 'vite'

interface Manifest {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

/** Shared Vite library-mode config: ESM only, dependencies stay external. `entries` maps output names to sources. */
export function libraryConfig(root: string, entries: Record<string, string> = { index: 'src/index.ts' }): UserConfig {
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as Manifest
  const external = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })

  return {
    root,
    build: {
      target: 'es2023',
      sourcemap: true,
      emptyOutDir: true,
      lib: {
        entry: Object.fromEntries(Object.entries(entries).map(([name, file]) => [name, resolve(root, file)])),
        formats: ['es'],
        fileName: (_, name) => `${name}.js`,
      },
      rolldownOptions: {
        external: (id) => external.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      },
    },
  }
}
