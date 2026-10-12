import aurora from '@goatsoft/aurora-unplugin/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), aurora()],
  // Use workspace sources directly, like every package in this repo.
  resolve: { conditions: ['@goatsoft/source'] },
  ssr: { resolve: { conditions: ['@goatsoft/source'] }, noExternal: [/^@goatsoft\//] },
})
