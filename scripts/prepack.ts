/**
 * `prepack` for every published package: copies the repo's MIT `LICENSE` into the package, so the
 * tarball carries the notice the licence requires. The copies are ignored by Git.
 */
import { copyFileSync } from 'node:fs'
import { join } from 'node:path'

copyFileSync(join(import.meta.dirname, '..', 'LICENSE'), join(process.cwd(), 'LICENSE'))
