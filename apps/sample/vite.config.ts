import aurora from '@goatsoft/aurora-unplugin/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

export default defineConfig({
  plugins: [vue(), aurora()],
  resolve: {
    // Use workspace sources directly, like every package in this repo.
    conditions: ['@goatsoft/source'],
    // `~/presets/goat/hero.aurora` is the repo's GOAT pack (tsconfig `paths` mirrors this).
    alias: [{ find: /^~\//, replacement: `${searchForWorkspaceRoot(import.meta.dirname)}/` }],
  },
  ssr: { resolve: { conditions: ['@goatsoft/source'] }, noExternal: [/^@goatsoft\//] },
})
