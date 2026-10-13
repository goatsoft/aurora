import aurora from '@goatsoft/aurora-unplugin/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss(), aurora()],
  resolve: {
    // Use workspace sources directly, like every package in this repo.
    conditions: ['@goatsoft/source'],
    // `~/presets/classic/hero.aurora` is one of the repo's classic presets (tsconfig `paths` mirrors this).
    alias: [{ find: /^~\//, replacement: `${searchForWorkspaceRoot(import.meta.dirname)}/` }],
  },
  ssr: { resolve: { conditions: ['@goatsoft/source'] }, noExternal: [/^@goatsoft\//] },
})
