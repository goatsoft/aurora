import type { Plugin } from 'vite'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import aurora from '@goatsoft/aurora-unplugin/vite'
import { gruff } from '@goatsoft/gruff'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import { VueRouterAutoImports } from 'vue-router/unplugin'
import VueRouter from 'vue-router/vite'
import { badgeSnippets } from './badge-snippets'
import { attributionBadges } from './badges'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = searchForWorkspaceRoot(here)
const docs = join(root, 'docs')
const REPO = 'https://github.com/goatsoft/aurora'

/** Decision records stay in the repo for contributors; links to them go to GitHub. */
const internal = join(docs, 'adr')

/** `docs/guide/vue.md` → `/docs/guide/vue`; a folder's `index.md` or `README.md` is the folder. */
function route(file: string): string | undefined {
  if (!file.startsWith(`${docs}/`) || !file.endsWith('.md') || file.startsWith(`${internal}/`)) return undefined
  const path = relative(docs, file).replace(/\.md$/, '').replace(/(^|\/)(index|README)$/, '')
  return `/docs${path ? `/${path}` : ''}`
}

function pages(dir = docs): { file: string, route: string }[] {
  return readdirSync(dir).flatMap((name) => {
    const file = join(dir, name)
    if (statSync(file).isDirectory()) return pages(file)
    const path = route(file)
    return path ? [{ file, route: path }] : []
  })
}

/**
 * The format's JSON Schema at /schema/v1.json, the URL every .aurora file's `$schema` points to:
 * served by the dev server and emitted with the client build.
 */
function schema(): Plugin {
  const file = join(root, 'packages/format/schema/v1.json')
  return {
    name: 'aurora-site:schema',
    configureServer(server) {
      server.watcher.add(file)
      server.middlewares.use('/schema/v1.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/schema+json')
        res.end(readFileSync(file))
      })
    },
    generateBundle() {
      if (this.environment.name === 'client') this.emitFile({ type: 'asset', fileName: 'schema/v1.json', source: readFileSync(file) })
    },
  }
}

/**
 * `src/warm.ts` as an entry of its own, started at once on every page (marked `data-eager`, so
 * gruff leaves it alone): gruff starts the app only when the page is idle, and warming up the
 * landing page's backgrounds shouldn't wait that long. Vite would merge it into the app's bundle
 * if it were a second script in index.html, so the build gives it its own input instead.
 */
function warm(): Plugin {
  const entry = `${here}src/warm.ts`
  return {
    name: 'aurora-site:warm',
    config(_, { command, isSsrBuild }) {
      if (command === 'build' && !isSsrBuild) return { build: { rolldownOptions: { input: { index: `${here}index.html`, warm: entry } } } }
      return undefined
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, { server, bundle }) {
        const chunk = Object.values(bundle ?? {}).find((c) => c.type === 'chunk' && c.isEntry && c.name === 'warm')
        const src = server ? '/src/warm.ts' : chunk && `/${chunk.fileName}`
        return src ? [{ tag: 'script', attrs: { 'type': 'module', src, 'data-eager': true }, injectTo: 'head' }] : []
      },
    },
  }
}

export default defineConfig({
  plugins: [
    schema(),
    warm(),
    attributionBadges(root),
    badgeSnippets(),
    // Pages from src/pages, and every Markdown file under the repo's docs/ as /docs/….
    VueRouter({
      root: here,
      routesFolder: [{ src: `${here}src/pages` }, { src: docs, path: 'docs/', exclude: ['**/adr/**'] }],
      extensions: ['.vue', '.md'],
      dts: process.env['VITEST'] ? false : `${here}src/typed-router.d.ts`,
      extendRoute(node) {
        if (node.fullPath.endsWith('/README')) node.path = node.path.replace(/\/?README$/, '')
      },
    }),
    ...gruff({
      root,
      route,
      pages: () => pages(),
      repoUrl: `${REPO}/blob/develop/`,
      glossary: join(docs, 'glossary.md'),
      // Docs pages get the docs layout; snippets in src/content render bare, for the landing page.
      layout: (id) => (id.includes('/src/content/') ? null : 'DocPage'),
    }),
    vue({ include: [/\.vue$/, /\.md$/] }),
    tailwindcss(),
    AutoImport({
      imports: ['vue', VueRouterAutoImports, { '@vueuse/core': ['useEventListener', 'useIntersectionObserver', 'useScroll', 'useWindowScroll', 'watchDebounced'] }],
      dts: process.env['VITEST'] ? false : `${here}src/auto-imports.d.ts`,
      vueTemplate: true,
    }),
    Components({ dirs: [`${here}src/components`], extensions: ['vue', 'md'], include: [/\.vue$/, /\.vue\?vue/, /\.md$/], dts: process.env['VITEST'] ? false : `${here}src/components.d.ts`, resolvers: [IconsResolver({ prefix: 'i', alias: { hg: 'hugeicons', si: 'simple-icons' } })] }),
    Icons({ compiler: 'vue3', scale: 1 }),
    aurora(),
  ],
  resolve: {
    conditions: ['@goatsoft/source'],
    alias: [
      { find: '~', replacement: root },
      { find: /^@\//, replacement: `${here}src/` },
    ],
  },
  ssr: { resolve: { conditions: ['@goatsoft/source'] }, noExternal: [/^@goatsoft\//, 'reka-ui'] },
  server: { fs: { allow: [root] } },
})
