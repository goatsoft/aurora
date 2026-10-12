import type { UnpluginFactory } from 'unplugin'
import { readFile } from 'node:fs/promises'
import { createUnplugin } from 'unplugin'
import { workspaceRoot } from './root'
import { createStudioApi, STUDIO_URL, studioLink } from './studio'
import { AuroraBuildError, transformAurora } from './transform'

export interface AuroraPluginOptions {
  /** Root that module ids are relative to. Defaults to the workspace root (or the project root). */
  root?: string
  /**
   * Vite dev server only: serve Aurora Studio's dev-tool API, so Studio can open this project's
   * `.aurora` files and save edits back to disk. On by default; `url` points at another Studio.
   */
  studio?: boolean | { url?: string }
}

/** `.aurora` imports, except `?raw` and `?url`, which the bundler handles as for any file. */
const AURORA = /\.aurora(?:\?(?!(?:[^#]*&)?(?:raw|url)(?:[&=#]|$))[^#]*)?$/

export const unpluginFactory: UnpluginFactory<AuroraPluginOptions | undefined> = (options = {}) => {
  let root = options.root ?? workspaceRoot(process.cwd())
  return {
    name: 'aurora',
    enforce: 'pre',
    load: {
      filter: { id: AURORA },
      async handler(id) {
        const file = id.replace(/\?.*$/, '')
        this.addWatchFile(file)
        try {
          return { code: await transformAurora(await readFile(file, 'utf8'), file, root), map: null }
        } catch (error) {
          if (!(error instanceof AuroraBuildError)) throw error
          this.error({ message: error.message, id: file, loc: error.loc, plugin: 'aurora' })
          return undefined
        }
      },
    },
    vite: {
      configResolved(config) {
        root = options.root ?? workspaceRoot(config.root)
      },
      configureServer(server) {
        if (options.studio === false) return
        const api = createStudioApi({ root })
        server.middlewares.use(api.middleware)
        const studio = typeof options.studio === 'object' ? options.studio.url : undefined
        server.httpServer?.once('listening', () => {
          const base = server.resolvedUrls?.local[0] ?? `http://localhost:${server.config.server.port}/`
          const link = studioLink(new URL('__aurora/', base).toString(), api.token, studio ?? process.env['AURORA_STUDIO_URL'] ?? STUDIO_URL)
          server.config.logger.info(`  \u001b[36m➜\u001b[0m  Aurora Studio: ${link}`)
        })
      },
    },
  }
}

/** `import hero from './hero.aurora'`, for every bundler unplugin supports. */
export const aurora = /* #__PURE__ */ createUnplugin(unpluginFactory)
export default aurora
export { AuroraBuildError, transformAurora } from './transform'
export { jsonLocations, locate } from './locate'
export { createStudioApi, STUDIO_ORIGIN, STUDIO_URL, studioLink } from './studio'
export type { StudioApi, StudioApiOptions } from './studio'
