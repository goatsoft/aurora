import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { BLEND_MODES, FADES, MIX_SPACES, REDUCED_MOTION, SCHEMA_URL, assertAurora, parseAurora, stringifyAurora } from '../src/index'

// JSON has no -0, so documents never contain it.
const double = (constraints: fc.DoubleConstraints) => fc.double({ noNaN: true, noDefaultInfinity: true, ...constraints }).map((n) => n || 0)

const unit = double({ min: 0, max: 1 })
const color = fc.oneof(
  fc.tuple(unit, double({ min: 0, max: 0.4 }), double({ min: 0, max: 360 }))
    .map(([l, c, h]) => `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`),
  fc.integer({ min: 0, max: 0xffffff }).map((n) => `#${n.toString(16).padStart(6, '0')}`),
)
const generator = fc.stringMatching(/^[a-z][a-z\d]{0,8}(?:-[a-z\d]{1,6}){0,2}$/)

const document = fc.array(color, { minLength: 1, maxLength: 16 }).chain((palette) =>
  fc.record(
    {
      format: fc.constant('aurora'),
      version: fc.constant(1),
      name: fc.string({ minLength: 1, maxLength: 120 }),
      canvas: fc.record({ fade: fc.constantFrom(...FADES), fixed: fc.boolean(), parallax: unit }, { requiredKeys: [] }),
      motion: fc.record(
        { speed: double({ min: 0, max: 10 }), reduced: fc.constantFrom(...REDUCED_MOTION) },
        { requiredKeys: [] },
      ),
      palette: fc.constant(palette),
      layers: fc.array(
        fc.record(
          {
            type: generator,
            blend: fc.constantFrom(...BLEND_MODES),
            opacity: unit,
            params: fc.dictionary(fc.string({ maxLength: 10 }), fc.oneof(double({}), fc.boolean(), fc.string())),
            colors: fc.array(fc.integer({ min: 0, max: palette.length - 1 }), { maxLength: 4 }),
            mix: fc.constantFrom(...MIX_SPACES),
            mask: fc.oneof(
              fc.record({ type: fc.constant('linear' as const), angle: double({ min: -360, max: 360 }), start: unit, end: unit }),
              fc.record({ type: fc.constant('radial' as const), x: unit, y: unit, start: unit, end: unit }),
            ),
          },
          { requiredKeys: ['type'] },
        ),
        { minLength: 1, maxLength: 16 },
      ),
    },
    { requiredKeys: ['format', 'version', 'name', 'palette', 'layers'] },
  ),
)

describe('fuzz', () => {
  it('accepts every valid document and round-trips it through text', () => {
    fc.assert(
      fc.property(document, (input) => {
        const doc = assertAurora(input)
        const text = stringifyAurora(doc)
        expect(assertAurora(text)).toEqual({ $schema: SCHEMA_URL, ...doc })
        expect(stringifyAurora(assertAurora(text))).toBe(text)
      }),
      { numRuns: 300 },
    )
  })

  it('never throws on arbitrary input, and every issue has a JSONPath', () => {
    fc.assert(
      fc.property(fc.oneof(fc.anything(), fc.json(), fc.string()), (input) => {
        const result = parseAurora(input)
        return result.ok || result.issues.every((i) => i.path.startsWith('$') && i.message.length > 0)
      }),
      { numRuns: 1000 },
    )
  })

  it('never throws when one field of a valid document is replaced with junk', () => {
    fc.assert(
      fc.property(document, fc.jsonValue(), fc.nat(), (input, junk, pick) => {
        const keys = Object.keys(input)
        const broken = { ...input, [keys[pick % keys.length]!]: junk }
        const result = parseAurora(broken)
        return result.ok || result.issues.length > 0
      }),
      { numRuns: 500 },
    )
  })
})
