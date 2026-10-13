import type { Plugin } from 'vite'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Stable public URLs without moving protected brand assets into MIT packages. */
export function attributionBadges(root: string): Plugin {
  const directory = join(root, 'assets/brand/badges/v1')
  const files = new Map(readdirSync(directory).filter((name) => name.endsWith('.svg')).map((name) => [
    `/badges/v1/${name}`, readFileSync(join(directory, name), 'utf8'),
  ]))
  return {
    name: 'aurora-attribution-badges',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const source = files.get((req.url ?? '').split('?')[0]!)
        if (!source) {
          next()
          return
        }
        res.setHeader('Content-Type', 'image/svg+xml')
        res.end(source)
      })
    },
    generateBundle() {
      for (const [path, source] of files) {
        this.emitFile({ type: 'asset', fileName: path.slice(1), source })
      }
    },
  }
}
