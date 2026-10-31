/**
 * `postpack` for every published package: puts back the `package.json` that `prepack.ts` saved
 * before it took the `@goatsoft/source` condition out for the tarball.
 */
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const saved = join(process.cwd(), 'package.json.prepack')
if (existsSync(saved)) renameSync(saved, join(process.cwd(), 'package.json'))
