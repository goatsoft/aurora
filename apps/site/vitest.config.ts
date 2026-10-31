import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import site from './vite.config'

export default mergeConfig(site, defineConfig({
  // Pre-bundle everything the tests reach up front: a dependency discovered mid-run makes Vite reload
  // the page, which can fail whichever test file is importing at that moment.
  optimizeDeps: { include: ['vue', 'vue-router', '@vue/test-utils', '@vueuse/core', 'reka-ui', 'minisearch', 'class-variance-authority', 'clsx', 'tailwind-merge'] },
  test: {
    name: 'site',
    root: import.meta.dirname,
    include: ['test/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      screenshotFailures: false,
      provider: playwright({ launchOptions: process.env['AURORA_CHROME'] ? { channel: 'chrome' } : {} }),
      instances: [{ browser: 'chromium' }],
    },
  },
}))
