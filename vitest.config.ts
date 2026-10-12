import { playwright } from '@vitest/browser-playwright'
import { defaultClientConditions, defaultServerConditions } from 'vite'
import { defineConfig } from 'vitest/config'

// Workspace packages resolve to their TypeScript sources, so tests never need a build.
const source = '@goatsoft/source'
const resolve = { conditions: [source, ...defaultClientConditions] }
const ssr = { resolve: { conditions: [source, ...defaultServerConditions] } }

// Headless Chromium has no GPU on CI runners: SwiftShader gives it a real, spec-conformant WebGPU adapter.
const chromiumWebGPU = [
  '--enable-unsafe-webgpu',
  '--enable-features=Vulkan',
  '--use-angle=swiftshader',
  '--use-webgpu-adapter=swiftshader',
]

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**'],
      reporter: ['text', 'html', 'lcov'],
      // PLAN.md Phase 1: the format and colour packages stay at 100%.
      thresholds: {
        'packages/color/src/**': { 100: true },
        'packages/format/src/**': { 100: true },
      },
    },
    projects: [
      {
        // Apps consume the built packages, like real apps do: run after `pnpm build`.
        test: {
          name: 'apps',
          environment: 'node',
          include: ['apps/*/test/**/*.test.ts'],
        },
      },
      {
        ssr,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['packages/*/test/**/*.test.ts'],
          exclude: ['**/*.browser.test.ts'],
        },
      },
      {
        resolve,
        // Declared up front so Vite never reloads a test run when it discovers them.
        optimizeDeps: { include: ['vue', 'vue/server-renderer', '@vue/test-utils', 'fast-check'] },
        test: {
          name: 'browser',
          include: ['packages/*/test/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            provider: playwright({ launchOptions: { args: chromiumWebGPU } }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
