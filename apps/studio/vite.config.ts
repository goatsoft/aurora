import aurora from '@goatsoft/aurora-unplugin/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import VueRouter from 'vue-router/vite'
import { VueRouterAutoImports } from 'vue-router/unplugin'

const root = searchForWorkspaceRoot(import.meta.dirname)

export default defineConfig({
  // Hosted under /studio/ on aurora.goatsoft.io; served from / in dev and dev-tool mode.
  base: process.env['STUDIO_BASE'] ?? '/',
  plugins: [
    // File-based routes from src/pages (must run before the Vue plugin).
    VueRouter({ routesFolder: 'src/pages', dts: 'src/typed-router.d.ts' }),
    vue(),
    tailwindcss(),
    AutoImport({ imports: ['vue', VueRouterAutoImports, '@vueuse/core'], dts: 'src/auto-imports.d.ts', vueTemplate: true }),
    // Components in src/components register themselves; icons are <IHg…> from Hugeicons.
    Components({ dts: 'src/components.d.ts', resolvers: [IconsResolver({ prefix: 'i', alias: { hg: 'hugeicons' }, customCollections: [] })] }),
    Icons({ compiler: 'vue3', scale: 1 }),
    aurora(),
  ],
  resolve: {
    // Use workspace sources directly, like every package in this repo.
    conditions: ['@goatsoft/source'],
    alias: [
      // A string alias, so import.meta.glob resolves it too; it never matches `~icons/…`.
      { find: '~', replacement: root },
      { find: /^@\//, replacement: `${import.meta.dirname}/src/` },
    ],
  },
  server: { fs: { allow: [root] } },
})
