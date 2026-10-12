import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import studio from './vite.config'

/**
 * Studio's component tests, with Studio's own Vite config (auto-imports, icons, routes). That config
 * loads the built unplugin, so this runs after `pnpm build`, in `pnpm test:apps`.
 */
export default mergeConfig(studio, defineConfig({
  optimizeDeps: { include: ['vue', '@vue/test-utils', 'reka-ui', '@vueuse/core', 'motion-v'] },
  test: {
    name: 'studio',
    root: import.meta.dirname,
    include: ['test/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      screenshotFailures: false,
      provider: playwright({ launchOptions: { args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=swiftshader', '--use-webgpu-adapter=swiftshader'] } }),
      instances: [{ browser: 'chromium' }],
    },
  },
}))
