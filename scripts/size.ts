/**
 * Size budgets (PLAN.md §3.2), measured the way a site ships them: minified, dependencies bundled,
 * gzipped. `pnpm size` prints them; `pnpm verify` fails when one is exceeded.
 */
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'
import { build } from 'vite'
import type { Rolldown } from 'vite'

const root = resolve(import.meta.dirname, '..')
const KB = 1024

interface Budget {
  name: string
  entry: string
  limit: number
  /** Leave these out: they are measured separately or ship in another chunk. */
  external?: RegExp
}

const budgets: Budget[] = [
  { name: '@goatsoft/aurora (main thread)', entry: 'packages/core/src/index.ts', limit: 10 * KB },
  { name: '@goatsoft/aurora worker', entry: 'packages/core/src/worker.ts', limit: 10 * KB },
  { name: 'generator: aurora-fbm', entry: 'packages/core/src/generators/aurora-fbm.ts', limit: 2 * KB, external: /^@goatsoft\/|\.\.\/generator/ },
]

async function measure({ entry, external }: Budget) {
  const result = await build({
    root,
    logLevel: 'silent',
    configFile: false,
    resolve: { conditions: ['@goatsoft/source', 'module', 'browser', 'default'] },
    build: {
      write: false,
      minify: true,
      target: 'es2023',
      lib: { entry: resolve(root, entry), formats: ['es'], fileName: 'out' },
      rolldownOptions: external ? { external: (id) => external.test(id) } : {},
    },
  })
  const outputs = (Array.isArray(result) ? result : [result]) as Rolldown.RolldownOutput[]
  // Only the entry chunk counts; lazily imported chunks (the worker, the main-thread renderer) load on demand.
  const entryChunk = outputs.flatMap((o) => o.output).find((o) => o.type === 'chunk' && o.isEntry)
  if (entryChunk?.type !== 'chunk') throw new Error(`No entry chunk for ${entry}`)
  return gzipSync(entryChunk.code, { level: 9 }).length
}

let failed = false
for (const budget of budgets) {
  const size = await measure(budget)
  const ok = size <= budget.limit
  failed ||= !ok
  console.log(`${ok ? '✓' : '✗'} ${budget.name.padEnd(34)} ${(size / KB).toFixed(2).padStart(6)} kB gzip  (budget ${budget.limit / KB} kB)`)
}
if (failed) {
  console.error('\nOver budget. See PLAN.md §3.2.')
  process.exit(1)
}
