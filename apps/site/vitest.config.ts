import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import site from './vite.config'

export default mergeConfig(site, defineConfig({
  test: {
    name: 'site',
    root: import.meta.dirname,
    include: ['test/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      screenshotFailures: false,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
}))
