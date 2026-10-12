import aurora from '@goatsoft/aurora-unplugin/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import VueRouter from 'vue-router/vite'
import { VueRouterAutoImports } from 'vue-router/unplugin'

// From import.meta.url, not import.meta.dirname: Vitest bundles this config when it extends it.
const here = fileURLToPath(new URL('.', import.meta.url))
const root = searchForWorkspaceRoot(here)

export default defineConfig({
  // Hosted under /studio/ on aurora.goatsoft.io; served from / in dev and dev-tool mode.
  base: process.env['STUDIO_BASE'] ?? '/',
  plugins: [
    // File-based routes from src/pages (must run before the Vue plugin).
    VueRouter({ routesFolder: `${here}src/pages`, dts: `${here}src/typed-router.d.ts` }),
    vue(),
    tailwindcss(),
    // VueUse is listed by name (its preset resolves from the working directory, which breaks under the root Vitest).
    AutoImport({
      imports: ['vue', VueRouterAutoImports, { '@vueuse/core': ['refDebounced', 'useElementSize', 'useEventListener', 'useIntervalFn', 'watchDebounced'] }],
      dts: `${here}src/auto-imports.d.ts`,
      vueTemplate: true,
    }),
    // Components in src/components register themselves; icons are <IHg…> from Hugeicons.
    Components({ dirs: [`${here}src/components`], dts: `${here}src/components.d.ts`, resolvers: [IconsResolver({ prefix: 'i', alias: { hg: 'hugeicons' }, customCollections: [] })] }),
    Icons({ compiler: 'vue3', scale: 1 }),
    aurora(),
  ],
  resolve: {
    // Use workspace sources directly, like every package in this repo.
    conditions: ['@goatsoft/source'],
    alias: [
      // A string alias, so import.meta.glob resolves it too; it never matches `~icons/…`.
      { find: '~', replacement: root },
      { find: /^@\//, replacement: `${here}src/` },
    ],
  },
  server: { fs: { allow: [root] } },
})
