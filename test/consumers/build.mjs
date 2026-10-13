// Builds src/ with one bundler into dist/<bundler>, the way a consuming project would configure it.
// Usage: node build.mjs vite|rollup|rolldown|esbuild|webpack|rspack
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

const bundler = process.argv[2]
const here = import.meta.dirname
const out = resolve(here, 'dist', bundler)
const entry = resolve(here, 'src/main.js')
rmSync(out, { recursive: true, force: true })

/** webpack and Rspack share an API: run the compiler and fail on any error. */
function compile(create, config) {
  return new Promise((done, fail) => {
    create(config).run((error, stats) => {
      if (error) fail(error)
      else if (stats.hasErrors()) fail(new Error(stats.toString('errors-only')))
      else done()
    })
  })
}

switch (bundler) {
  case 'vite': {
    const { build } = await import('vite')
    const vue = (await import('@vitejs/plugin-vue')).default
    const aurora = (await import('@goatsoft/aurora-unplugin/vite')).default
    await build({ root: here, logLevel: 'error', plugins: [vue(), aurora()], build: { outDir: out } })
    break
  }
  case 'rollup': {
    const { rollup } = await import('rollup')
    const { nodeResolve } = await import('@rollup/plugin-node-resolve')
    const aurora = (await import('@goatsoft/aurora-unplugin/rollup')).default
    const bundle = await rollup({ input: entry, plugins: [nodeResolve({ browser: true }), aurora()] })
    await bundle.write({ dir: out, format: 'es' })
    break
  }
  case 'rolldown': {
    const { build } = await import('rolldown')
    const aurora = (await import('@goatsoft/aurora-unplugin/rolldown')).default
    await build({ input: entry, plugins: [aurora()], logLevel: 'silent', output: { dir: out, format: 'es' } })
    break
  }
  case 'esbuild': {
    const { build } = await import('esbuild')
    const aurora = (await import('@goatsoft/aurora-unplugin/esbuild')).default
    await build({ entryPoints: [entry], bundle: true, splitting: true, format: 'esm', platform: 'browser', outdir: out, logLevel: 'error', plugins: [aurora()] })
    break
  }
  case 'webpack': {
    const { default: webpack } = await import('webpack')
    const aurora = (await import('@goatsoft/aurora-unplugin/webpack')).default
    await compile(webpack, { mode: 'production', context: here, entry, output: { path: out }, plugins: [aurora()] })
    break
  }
  case 'rspack': {
    const { rspack } = await import('@rspack/core')
    const aurora = (await import('@goatsoft/aurora-unplugin/rspack')).default
    await compile(rspack, { mode: 'production', context: here, entry, output: { path: out }, plugins: [aurora()] })
    break
  }
  default:
    throw new Error(`Unknown bundler: ${bundler}`)
}
