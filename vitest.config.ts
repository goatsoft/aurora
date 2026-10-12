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
    },
    projects: [
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
