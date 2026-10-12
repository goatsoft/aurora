import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { build, createServer } from 'vite'
import { describe, expect, inject, it } from 'vitest'
import esbuild from '@/esbuild'
import { AuroraBuildError, jsonLocations, locate, transformAurora } from '@/index'
import rolldown from '@/rolldown'
import rollup from '@/rollup'
import rspack from '@/rspack'
import aurora from '@/vite'
import webpack from '@/webpack'

const here = import.meta.dirname
const root = inject('root')
const fixture = (name: string) => resolve(here, 'fixtures', name)
const read = (file: string) => readFileSync(file, 'utf8')

describe('locate', () => {
  const text = '{\n  "a": [1, { "b": "x\\"y" }],\n  "c d": true\n}'
  it('maps keys and array items to their offsets', () => {
    const map = jsonLocations(text)
    expect(locate(text, '$.a', map)).toEqual({ line: 2, column: 2 })
    expect(locate(text, '$.a[1].b', map)).toEqual({ line: 2, column: 13 })
    expect(locate(text, '$["c d"]', map)).toEqual({ line: 3, column: 2 })
  })

  it('falls back to the nearest ancestor, then the start', () => {
    expect(locate(text, '$.a[1].missing')).toEqual({ line: 2, column: 11 })
    expect(locate(text, '$')).toEqual({ line: 1, column: 0 })
    expect(locate('', '$.x')).toEqual({ line: 1, column: 0 })
  })

  it('survives malformed JSON', () => {
    expect([...jsonLocations('{ "a": [1, 2').keys()]).toEqual(['$', '$.a', '$.a[0]', '$.a[1]'])
    expect([...jsonLocations('{ "a" 1 }').keys()]).toEqual(['$', '$.a'])
    expect([...jsonLocations('{ "a": "\\x" }').keys()]).toEqual(['$', '$.a'])
  })
})

describe('transformAurora', () => {
  const hero = resolve(root, 'presets/goat/hero.aurora')

  it('exports { id, doc, css } with a root-relative id and accepts hot updates', async () => {
    const code = await transformAurora(read(hero), hero, root)
    expect(code).toContain('import.meta.hot.accept')
    const module = (await import(`data:text/javascript,${encodeURIComponent(code)}`) as { default: { id: string, doc: { name: string }, css: { backgroundImage: string } } }).default
    expect(module.id).toBe('presets/goat/hero.aurora')
    expect(module.doc.name).toBe('GOAT hero')
    expect(module.css.backgroundImage).toContain('radial-gradient')
    expect(await transformAurora(read(hero), hero, hero)).toContain('"id":"/')
  })

  it.each([
    ['broken.aurora', 'Invalid .aurora file broken.aurora:\n  broken.aurora:6:38  $.layers[0].blnd is not a known key. Did you mean "blend"?', { line: 6, column: 37 }],
    ['range.aurora', 'Invalid .aurora file range.aurora:\n  range.aurora:2:50  $.layers[0].params.intensity must be between 0 and 2, got 5.', { line: 2, column: 49 }],
    ['syntax.aurora', /^Invalid \.aurora file syntax\.aurora:\n {2}syntax\.aurora:5:3 {2}\$ is not valid JSON: /, { line: 5, column: 2 }],
  ] as const)('points at the problem in %s', async (name, message, loc) => {
    const file = fixture(name)
    let error: unknown
    try {
      await transformAurora(read(file), file, resolve(here, 'fixtures'))
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(AuroraBuildError)
    const { message: actual, loc: actualLoc } = error as AuroraBuildError
    if (typeof message === 'string') expect(actual).toBe(message)
    else expect(actual).toMatch(message)
    expect(actualLoc).toEqual({ ...loc, file })
  })
})

describe('bundlers', () => {
  it('exports a plugin for every bundler unplugin supports', () => {
    for (const plugin of [rollup, rolldown, esbuild, webpack, rspack]) expect(plugin).toBeTypeOf('function')
    expect(aurora()).toMatchObject({ name: 'aurora', enforce: 'pre' })
  })

  it('builds .aurora imports with Vite', async () => {
    const output = await build({
      root: here,
      logLevel: 'silent',
      configFile: false,
      plugins: [aurora()],
      resolve: { conditions: ['@goatsoft/source', 'module', 'browser', 'default'], alias: [{ find: /^~\//, replacement: `${root}/` }] },
      build: { write: false, lib: { entry: fixture('app.ts'), formats: ['es'], fileName: 'app' }, minify: false },
    })
    const code = (Array.isArray(output) ? output : [output]).flatMap((o) => 'output' in o ? o.output : []).map((o) => ('code' in o ? o.code : '')).join('\n')
    expect(code).toContain('GOAT hero')
    expect(code).toContain('radial-gradient(60% 40% at 20% 30% in srgb')
    expect(code).not.toContain(here)
  })

  it('leaves ?raw and ?url imports to Vite, so editors can read files as authored', async () => {
    const server = await createServer({
      root,
      logLevel: 'silent',
      configFile: false,
      plugins: [aurora()],
      resolve: { alias: { '@goatsoft/aurora': resolve(root, 'packages/core/src/index.ts') } },
      server: { middlewareMode: true, hmr: false },
    })
    try {
      const raw = await server.transformRequest('/presets/goat/hero.aurora?raw')
      expect(raw?.code).toContain(JSON.stringify(readFileSync(resolve(root, 'presets/goat/hero.aurora'), 'utf8')))
      const url = await server.transformRequest('/presets/goat/hero.aurora?url')
      expect(url?.code).toContain('/presets/goat/hero.aurora')
      expect(url?.code).not.toContain('GOAT hero')
      const module = await server.transformRequest('/presets/goat/hero.aurora?import&v=1')
      expect(module?.code).toContain('"id":"presets/goat/hero.aurora"')
    } finally {
      await server.close()
    }
  })

  it('fails the Vite build with the file, line and column', async () => {
    const entry = fixture('broken.aurora')
    await expect(build({
      root: here,
      logLevel: 'silent',
      configFile: false,
      plugins: [aurora({ root: here })],
      build: { write: false, lib: { entry, formats: ['es'], fileName: 'x' } },
    })).rejects.toMatchObject({ message: expect.stringContaining('fixtures/broken.aurora:6:38  $.layers[0].blnd is not a known key. Did you mean "blend"?') as string })
  })

  it('serves hot-updatable modules from the Vite dev server', async () => {
    const server = await createServer({
      root,
      logLevel: 'silent',
      configFile: false,
      plugins: [aurora()],
      resolve: { alias: { '@goatsoft/aurora': resolve(root, 'packages/core/src/index.ts') } },
      server: { middlewareMode: true, hmr: false },
    })
    try {
      const result = await server.transformRequest('/presets/goat/hero.aurora')
      expect(result?.code).toContain('"id":"presets/goat/hero.aurora"')
      expect(result?.code).toContain('import.meta.hot')
    } finally {
      await server.close()
    }
  })

  it('resolves the hot-update import from the project for .aurora files outside it', async () => {
    const project = resolve(root, 'apps/sample')
    const server = await createServer({
      root: project,
      logLevel: 'silent',
      configFile: false,
      plugins: [aurora()],
      resolve: { conditions: ['@goatsoft/source'] },
      server: { middlewareMode: true, hmr: false, fs: { allow: [root] } },
    })
    try {
      const result = await server.transformRequest(`/@fs${resolve(root, 'presets/scenes/polar-night.aurora')}`)
      expect(result?.code).toContain('packages/core/src/index.ts')
    } finally {
      await server.close()
    }
  })
})

describe('workspaceRoot', () => {
  it('finds the monorepo root, or keeps the directory outside one', async () => {
    const { workspaceRoot } = await import('@/root')
    const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    expect(workspaceRoot(resolve(root, 'apps/sample/src'))).toBe(root)
    const outside = mkdtempSync(resolve(tmpdir(), 'aurora-'))
    expect(workspaceRoot(outside)).toBe(outside)
    mkdirSync(resolve(outside, 'app'))
    writeFileSync(resolve(outside, 'package.json'), '{ "workspaces": ["app"] }')
    writeFileSync(resolve(outside, 'app/package.json'), '{}')
    expect(workspaceRoot(resolve(outside, 'app'))).toBe(outside)
  })
})
