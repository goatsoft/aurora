import type { ModifierSpec } from '@/index'
import { describe, expect, inject, it } from 'vitest'
import { assertAurora, MODIFIERS } from '@/index'
import { literal } from './codegen'

const root = inject('root')
const definitions: [string, ModifierSpec][] = Object.entries(MODIFIERS)
const base = { format: 'aurora', version: 1, name: 'Modifiers', palette: ['#fff'], layers: [{ type: 'aurora-fbm' }] } as const

// Keep authoring metadata out of the runtime validator bundle. Generated validators contain
// only the rules/defaults/hovers needed by the element; snapshots prevent either copy drifting.
function schemas(): string {
  const parts = definitions.map(([id, modifier]) => {
    const name = id[0]!.toUpperCase() + id.slice(1)
    const defaults = `${id.toUpperCase()}_DEFAULTS`
    const controls = Object.entries(modifier.controls)
    const values = controls.map(([key, p]) => `${key}: ${p.default}`).join(', ')
    const fields = controls.map(([key, p]) => {
      const rule = `range(${p.min}, ${p.max}, ${literal(p.description)})`
      return `  ${key}: v.optional(${p.step === 1 ? `v.pipe(${rule}, v.integer('must be a whole number'))` : rule}, ${defaults}.${key}),`
    }).join('\n')
    return `export const ${defaults} = { ${values} }\nexport const ${name} = v.strictObject({\n${fields}\n})`
  })
  return `// Generated from MODIFIERS by test/modifier-spec.test.ts; regenerate with pnpm test -u.\nimport * as v from 'valibot'\nimport { range } from './range'\n\n${parts.join('\n\n')}\n`
}

function reference(): string {
  const sections = definitions.map(([id, modifier]) => {
    const rows = Object.entries(modifier.controls).map(([key, p]) => `| \`${key}\` | ${p.label} | ${p.default} | ${p.min} to ${p.max} | ${p.step} | ${p.description} |`)
    return `## ${modifier.label} (\`${id}\`)\n\n${modifier.hint}\n\n| Field | Label | Default | Range | Step | Meaning |\n|---|---|---|---|---|---|\n${rows.join('\n')}`
  })
  return `---\norder: 5\n---\n\n# Modifier reference\n\nGenerated from the shared modifier spec. Controls are optional; an omitted modifier stays disabled. See the [format guide](format.md#modifiers) for examples, sampling cost and rendering units.\n\n${sections.join('\n\n')}\n`
}

describe('shared modifier spec', () => {
  it('generates the runtime validators and reference docs', async () => {
    await expect(schemas()).toMatchFileSnapshot(`${root}/packages/format/src/modifiers-schema.ts`)
    await expect(reference()).toMatchFileSnapshot(`${root}/docs/guide/modifiers.md`)
  })
  it('keeps defaults, boundaries and integer controls consistent with validation', () => {
    for (const [id, modifier] of definitions) {
      const defaults = Object.fromEntries(Object.entries(modifier.controls).map(([key, p]) => [key, p.default]))
      expect(assertAurora({ ...base, modifiers: { [id]: {} } }).modifiers?.[id as keyof typeof MODIFIERS]).toEqual(defaults)
      for (const [key, p] of Object.entries(modifier.controls)) {
        for (const value of [p.min, p.max]) expect(() => assertAurora({ ...base, modifiers: { [id]: { [key]: value } } })).not.toThrow()
        for (const value of [p.min - p.step, p.max + p.step]) expect(() => assertAurora({ ...base, modifiers: { [id]: { [key]: value } } })).toThrow(`must be between ${p.min} and ${p.max}`)
        if (p.step === 1) expect(() => assertAurora({ ...base, modifiers: { [id]: { [key]: p.min + 0.5 } } })).toThrow('must be a whole number')
      }
    }
  })
})
