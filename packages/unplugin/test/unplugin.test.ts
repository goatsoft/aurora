import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { build, createServer } from 'vite'
import { describe, expect, it } from 'vitest'
import { AuroraBuildError, jsonLocations, locate, transformAurora } from '../src/index'
import aurora from '../src/vite'
import rollup from '../src/rollup'
import rolldown from '../src/rolldown'
import esbuild from '../src/esbuild'
import webpack from '../src/webpack'
import rspack from '../src/rspack'

const here = import.meta.dirname
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
  const hero = resolve(here, '../../../presets/goat/hero.aurora')

  it('exports { id, doc, css } with a root-relative id and accepts hot updates', async () => {
    const code = transformAurora(read(hero), hero, resolve(here, '../../..'))
    expect(code).toContain('import.meta.hot.accept')
    const module = (await import(`data:text/javascript,${encodeURIComponent(code)}`) as { default: { id: string, doc: { name: string }, css: { backgroundImage: string } } }).default
    expect(module.id).toBe('presets/goat/hero.aurora')
    expect(module.doc.name).toBe('GOAT hero')
    expect(module.css.backgroundImage).toContain('radial-gradient')
    expect(transformAurora(read(hero), hero, hero)).toContain('"id":"/')
  })

  it.each([
    ['broken.aurora', 'Invalid .aurora file broken.aurora:\n  broken.aurora:6:38  $.layers[0].blnd is not a known key. Did you mean "blend"?', { line: 6, column: 37 }],
    ['range.aurora', 'Invalid .aurora file range.aurora:\n  range.aurora:2:50  $.layers[0].params.intensity must be between 0 and 2, got 5.', { line: 2, column: 49 }],
    ['syntax.aurora', /^Invalid \.aurora file syntax\.aurora:\n {2}syntax\.aurora:5:3 {2}\$ is not valid JSON: /, { line: 5, column: 2 }],
  ] as const)('points at the problem in %s', (name, message, loc) => {
    const file = fixture(name)
    let error: unknown
    try {
      transformAurora(read(file), file, resolve(here, 'fixtures'))
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
      resolve: { conditions: ['@goatsoft/source', 'module', 'browser', 'default'] },
      build: { write: false, lib: { entry: fixture('app.ts'), formats: ['es'], fileName: 'app' }, minify: false },
    })
    const code = (Array.isArray(output) ? output : [output]).flatMap((o) => 'output' in o ? o.output : []).map((o) => ('code' in o ? o.code : '')).join('\n')
    expect(code).toContain('GOAT hero')
    expect(code).toContain('radial-gradient(60% 40% at 20% 30% in srgb')
    expect(code).not.toContain(here)
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
    const server = await createServer({ root: resolve(here, '../../..'), logLevel: 'silent', configFile: false, plugins: [aurora()], resolve: { alias: { '@goatsoft/aurora': resolve(here, '../../core/src/index.ts') } }, server: { middlewareMode: true, hmr: false } })
    try {
      const result = await server.transformRequest('/presets/goat/hero.aurora')
      expect(result?.code).toContain('"id":"presets/goat/hero.aurora"')
      expect(result?.code).toContain('import.meta.hot')
    } finally {
      await server.close()
    }
  })
})
