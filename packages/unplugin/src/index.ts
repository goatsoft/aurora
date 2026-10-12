import { readFile } from 'node:fs/promises'
import { createUnplugin } from 'unplugin'
import type { UnpluginFactory } from 'unplugin'
import { AuroraBuildError, transformAurora } from './transform'

export interface AuroraPluginOptions {
  /** Project root for module ids. Defaults to Vite's root, or the working directory. */
  root?: string
}

const AURORA = /\.aurora(?:\?.*)?$/

export const unpluginFactory: UnpluginFactory<AuroraPluginOptions | undefined> = (options = {}) => {
  let root = options.root ?? process.cwd()
  return {
    name: 'aurora',
    enforce: 'pre',
    load: {
      filter: { id: AURORA },
      async handler(id) {
        const file = id.replace(/\?.*$/, '')
        this.addWatchFile(file)
        try {
          return { code: transformAurora(await readFile(file, 'utf8'), file, root), map: null }
        } catch (error) {
          if (!(error instanceof AuroraBuildError)) throw error
          this.error({ message: error.message, id: file, loc: error.loc, plugin: 'aurora' })
          return undefined
        }
      },
    },
    vite: {
      configResolved(config) {
        root = options.root ?? config.root
      },
    },
  }
}

/** `import hero from './hero.aurora'`, for every bundler unplugin supports. */
export const aurora = /* #__PURE__ */ createUnplugin(unpluginFactory)
export default aurora
export { AuroraBuildError, transformAurora } from './transform'
export { jsonLocations, locate } from './locate'
