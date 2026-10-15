import type { AuroraDocument, FormatIssue } from '@/index'
import { describe, expect, it } from 'vitest'
import { assertAurora, AuroraFormatError, defineAurora, parseAurora, SCHEMA_URL, stringifyAurora } from '@/index'
import classicHero from './fixtures/classic-hero.aurora?raw'

const minimal = { format: 'aurora', version: 1, name: 'Minimal', palette: ['#4f8cff'], layers: [{ type: 'aurora-fbm' }] }

function issuesOf(input: unknown): FormatIssue[] {
  const result = parseAurora(input)
  if (result.ok) throw new Error('expected issues')
  return result.issues
}

describe('parseAurora', () => {
  it('parses the classic hero from a JSON string', () => {
    const result = parseAurora(classicHero)
    expect(result.ok).toBe(true)
    expect(result.ok && result.doc.layers[0]!.params).toMatchObject({ intensity: 0.38, seed: 3 })
    expect(result.ok && result.sourceVersion).toBe(1)
  })

  it('fills every default', () => {
    expect(assertAurora(minimal)).toEqual({
      format: 'aurora',
      version: 1,
      name: 'Minimal',
      canvas: { fade: 'none', fixed: false, parallax: 0 },
      motion: { speed: 1, reduced: 'still' },
      palette: ['#4f8cff'],
      layers: [{ type: 'aurora-fbm', blend: 'normal', opacity: 1, params: {}, colors: [], mix: 'oklab' }],
      fallback: { mode: 'auto' },
    })
  })

  it('accepts masks and hand-tuned CSS fallbacks', () => {
    const doc = assertAurora({
      ...minimal,
      layers: [
        { type: 'mesh', mask: { type: 'linear', angle: 90 } },
        { type: 'grain', blend: 'overlay', mask: { type: 'radial', x: 0.3, end: 0.8 } },
      ],
      fallback: { mode: 'css', layers: ['radial-gradient(in oklab, oklch(0.68 0.16 245 / 0.3), transparent)'] },
    })
    expect(doc.layers[0]!.mask).toEqual({ type: 'linear', angle: 90, start: 0, end: 1 })
    expect(doc.layers[1]!.mask).toEqual({ type: 'radial', x: 0.3, y: 0.5, start: 0, end: 0.8 })
  })

  it('rejects invalid JSON', () => {
    expect(issuesOf('{ "format": ')[0]).toMatchObject({ path: '$', message: expect.stringMatching(/^is not valid JSON: /) as string })
  })

  const layer = (extra: object) => ({ ...minimal, layers: [{ type: 'aurora-fbm', ...extra }] })
  it.each([
    ['a typo in a key', layer({ blnd: 'screen' }), '$.layers[0].blnd', 'is not a known key. Did you mean "blend"?'],
    ['an unknown top-level key', { ...minimal, extra: 1 }, '$.extra', 'is not a known key. Expected one of: $schema, format, version, name, canvas, motion, modifiers, interactions, palette, layers, fallback.'],
    ['an unknown key in a mask', layer({ mask: { type: 'radial', radius: 1 } }), '$.layers[0].mask.radius', 'is not a known key. Expected one of: type, x, y, start, end.'],
    ['a missing field', { ...minimal, name: undefined }, '$.name', 'is required.'],
    ['a typo in an option', layer({ blend: 'scren' }), '$.layers[0].blend', 'must be "normal" | "screen" | "add" | "multiply" | "overlay", got "scren". Did you mean "screen"?'],
    ['a wrong option type', layer({ blend: 5 }), '$.layers[0].blend', 'must be "normal" | "screen" | "add" | "multiply" | "overlay", got 5.'],
    ['a one-letter option', { ...minimal, canvas: { fade: 'z' } }, '$.canvas.fade', 'must be "none" | "x" | "y", got "z".'],
    ['an unknown mask type', layer({ mask: { type: 'conic' } }), '$.layers[0].mask.type', 'must be "linear" | "radial", got "conic".'],
    ['an out-of-range number', layer({ opacity: 2 }), '$.layers[0].opacity', 'must be between 0 and 1.'],
    ['a bad generator id', layer({ type: 'Aurora' }), '$.layers[0].type', 'must be a generator id in kebab-case, like "aurora-fbm".'],
    ['a bad colour', { ...minimal, palette: ['rgb(1 2 3)'] }, '$.palette[0]', 'rgb() is not supported. Use oklch(L C H), oklab(L a b), color(srgb|display-p3 r g b) or #hex.'],
    ['a wrong type', { ...minimal, name: 5 }, '$.name', 'must be a string, got 5.'],
    ['a non-array', { ...minimal, palette: 'red' }, '$.palette', 'must be an array, got "red".'],
    ['a non-object', { ...minimal, canvas: 'big' }, '$.canvas', 'must be an object, got "big".'],
    ['a missing palette colour', layer({ colors: [0, 3] }), '$.layers[0].colors[1]', 'is 3, but the palette only has 1 colour (index 0).'],
    ['a resource-loading fallback', { ...minimal, fallback: { mode: 'css', layers: ['url(x.png)'] } }, '$.fallback.layers[0]', 'must not load resources (url(), image-set()).'],
    ['a CSS injection', { ...minimal, fallback: { mode: 'css', layers: ['red; } body { display: none'] } }, '$.fallback.layers[0]', 'must be a single CSS image value, without ; { } < > @ or \\.'],
  ])('explains %s', (_, input, path, message) => {
    expect(issuesOf(input)).toContainEqual({ path, message })
  })

  it('reports every issue at once', () => {
    const issues = issuesOf({ ...minimal, name: '', palette: [], layers: [{ type: 'aurora-fbm', opacity: -1 }] })
    expect(issues.map((i) => i.path)).toEqual(['$.name', '$.palette', '$.layers[0].opacity'])
  })

  it('reports palette references for every layer', () => {
    const doc = { ...minimal, palette: ['#000', '#fff'], layers: [{ type: 'a', colors: [2] }, { type: 'b', colors: [5] }] }
    expect(issuesOf(doc)).toEqual([
      { path: '$.layers[0].colors[0]', message: 'is 2, but the palette only has 2 colours (0–1).' },
      { path: '$.layers[1].colors[0]', message: 'is 5, but the palette only has 2 colours (0–1).' },
    ])
  })
})

describe('assertAurora', () => {
  it('throws an AuroraFormatError listing every issue', () => {
    const error = (() => {
      try {
        assertAurora({ ...minimal, name: 5 }, 'hero.aurora')
      } catch (e) {
        return e
      }
    })()
    expect(error).toBeInstanceOf(AuroraFormatError)
    expect((error as AuroraFormatError).name).toBe('AuroraFormatError')
    expect((error as AuroraFormatError).message).toBe('Invalid .aurora document in hero.aurora:\n  $.name must be a string, got 5.')
    expect((error as AuroraFormatError).issues).toHaveLength(1)
    expect(() => assertAurora('nope')).toThrow(/^Invalid \.aurora document:\n {2}\$ is not valid JSON/)
  })
})

describe('defineAurora', () => {
  it('adds the identity fields and type-checks the rest', () => {
    const input = defineAurora({ name: 'Typed', palette: ['oklch(0.7 0.1 200)'], layers: [{ type: 'waves', blend: 'add' }] })
    expect(input).toMatchObject({ $schema: SCHEMA_URL, format: 'aurora', version: 1 })
    expect(assertAurora(input).layers[0]!.blend).toBe('add')
  })
})

describe('stringifyAurora', () => {
  it('writes canonical key order with $schema first and a trailing newline', () => {
    const text = stringifyAurora({ layers: minimal.layers, name: 'Minimal', palette: minimal.palette, version: 1, format: 'aurora' })
    expect(Object.keys(JSON.parse(text) as object)).toEqual(['$schema', 'format', 'version', 'name', 'palette', 'layers'])
    expect(text.endsWith('}\n')).toBe(true)
    expect(text).toContain('\n  "name": "Minimal",\n')
  })

  it('round-trips the classic hero exactly', () => {
    const doc: AuroraDocument = assertAurora(classicHero)
    expect(assertAurora(stringifyAurora(doc))).toEqual(doc)
  })
})
