import { playwright } from '@vitest/browser-playwright'
import vue from '@vitejs/plugin-vue'
import { defaultClientConditions, defaultServerConditions } from 'vite'
import { defineConfig } from 'vitest/config'
import { ROOT, packageSrcAlias, rootAlias } from './aliases.ts'

// Workspace packages resolve to their TypeScript sources, so tests never need a build.
const source = '@goatsoft/source'
const resolve = { conditions: [source, ...defaultClientConditions], alias: [rootAlias] }
const ssr = { resolve: { conditions: [source, ...defaultServerConditions] } }
// `@/x` is the importing package's src/x; `~/x` is the repo root (see aliases.ts and each tsconfig's paths).
const plugins = [packageSrcAlias(), vue()]

// Headless Chromium has no GPU on CI runners: SwiftShader gives it a real, spec-conformant WebGPU adapter.
const chromiumWebGPU = [
  '--enable-unsafe-webgpu',
  '--enable-features=Vulkan',
  '--use-angle=swiftshader',
  '--use-webgpu-adapter=swiftshader',
]

export default defineConfig({
  test: {
    provide: { root: ROOT, updateGolden: process.env['UPDATE_GOLDEN'] === '1', ci: !!process.env['CI'] },
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
          include: ['apps/sample/test/**/*.test.ts'],
        },
      },
      {
        ssr,
        resolve: { alias: [rootAlias] },
        plugins,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['packages/*/test/**/*.test.ts', 'apps/studio/test/**/*.test.ts'],
          exclude: ['**/*.browser.test.ts'],
        },
      },
      {
        resolve,
        plugins,
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
      {
        // Studio's components, with Studio's own Vite config (auto-imports, icons, routes).
        extends: './apps/studio/vite.config.ts',
        optimizeDeps: { include: ['vue', '@vue/test-utils', 'reka-ui', '@vueuse/core', 'motion-v'] },
        test: {
          name: 'studio',
          root: 'apps/studio',
          include: ['test/**/*.browser.test.ts'],
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
