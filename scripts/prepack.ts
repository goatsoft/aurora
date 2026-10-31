/**
 * `prepack` for every published package:
 *
 * - copies the repo's MIT `LICENSE` into the package, so the tarball carries the notice the licence
 *   requires (the copies are ignored by Git);
 * - takes the workspace-only `@goatsoft/source` export condition out of `package.json`. It points at
 *   `src/`, which isn't published, so a project that turns the condition on would fail to resolve
 *   the package. The original is kept in `package.json.prepack` and put back by `postpack.ts`.
 */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SOURCE_CONDITION = '@goatsoft/source'

/** `exports` without the source condition, at any depth. */
function withoutSource(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutSource)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([key]) => key !== SOURCE_CONDITION).map(([key, inner]) => [key, withoutSource(inner)]))
  }
  return value
}

const dir = process.cwd()
copyFileSync(join(import.meta.dirname, '..', 'LICENSE'), join(dir, 'LICENSE'))

const file = join(dir, 'package.json')
const text = readFileSync(file, 'utf8')
const manifest = JSON.parse(text) as { exports?: unknown }
writeFileSync(join(dir, 'package.json.prepack'), text)
manifest.exports = withoutSource(manifest.exports)
writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
