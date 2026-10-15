import type { ModifierControl } from '@/index'
import { describe, expect, inject, it } from 'vitest'
import { assertAurora, INTERACTION_ACTIVATION, INTERACTION_BINDING_CONTROLS, INTERACTION_CONTROLS, INTERACTION_INPUTS, INTERACTION_LIMITS, INTERACTIONS } from '@/index'
import { literal } from './codegen'

const root = inject('root')
const base = { format: 'aurora', version: 1, name: 'Interactions', palette: ['#fff'], layers: [{ type: 'aurora-fbm' }] } as const
const fields = (controls: Record<string, ModifierControl>) => Object.entries(controls).map(([key, p]) => {
  const rule = `range(${p.min}, ${p.max}, ${literal(p.description)})`
  return `  ${key}: v.optional(${p.step === 1 ? `v.pipe(${rule}, v.integer('must be a whole number'))` : rule}, ${p.default}),`
}).join('\n')
const list = (values: string[]) => `[${values.map(literal).join(', ')}]`

function schemas() {
  return `// Generated from INTERACTIONS by test/interaction-spec.test.ts; regenerate with pnpm test -u.
import * as v from 'valibot'
import { range } from './range'

export const MAX_INTERACTIONS = ${INTERACTION_LIMITS.modules}
export const MAX_INTERACTION_BINDINGS = ${INTERACTION_LIMITS.bindings}
export const InteractionBindingControls = {
  input: v.picklist(${list(Object.keys(INTERACTION_INPUTS))}),
${fields(INTERACTION_BINDING_CONTROLS)}
}
export const InteractionControls = {
  type: v.picklist(${list(Object.keys(INTERACTIONS))}),
  activation: v.optional(v.picklist(${list(Object.keys(INTERACTION_ACTIVATION.options))}), ${literal(INTERACTION_ACTIVATION.default)}),
${fields(INTERACTION_CONTROLS)}
}
`
}

function reference() {
  const table = (controls: Record<string, ModifierControl>) => `| Field | Label | Default | Range | Step | Meaning |\n|---|---|---|---|---|---|\n${Object.entries(controls).map(([key, p]) => `| \`${key}\` | ${p.label} | ${p.default} | ${p.min} to ${p.max} | ${p.step} | ${p.description} |`).join('\n')}`
  const sections = Object.entries(INTERACTIONS).map(([type, spec]) => `## ${spec.label} (\`${type}\`)\n\n${spec.hint}\n\n${table(Object.fromEntries(spec.controls.map((key) => [key, INTERACTION_CONTROLS[key]])))}`)
  return `---\ntitle: Interaction reference\norder: 9\n---\n\n# Interaction reference\n\nGenerated from the shared interaction spec. See the [interaction guide](interactions.md) for examples and input behaviour. A document supports up to ${INTERACTION_LIMITS.modules} modules, each with up to ${INTERACTION_LIMITS.bindings} bindings.\n\nActivation: ${Object.entries(INTERACTION_ACTIVATION.options).map(([value, label]) => `\`${value}\` (${label.toLowerCase()})`).join(', ')}. Default: \`${INTERACTION_ACTIVATION.default}\`.\n\n${sections.join('\n\n')}\n\n## Bindings\n\nInputs: ${Object.entries(INTERACTION_INPUTS).map(([value, label]) => `\`${value}\` (${label.toLowerCase()})`).join(', ')}. Only Impulse emits \`travel\` or uses pulse slots beyond zero. Signal bindings omit \`layer\`.\n\n${table(INTERACTION_BINDING_CONTROLS)}\n`
}

describe('shared interaction spec', () => {
  it('generates authoring schemas and reference docs from the controls', async () => {
    await expect(schemas()).toMatchFileSnapshot(`${root}/packages/format/src/interactions-schema.ts`)
    await expect(reference()).toMatchFileSnapshot(`${root}/docs/guide/interaction-reference.md`)
  })
  it('keeps every module default and boundary consistent with validation', () => {
    for (const type of Object.keys(INTERACTIONS) as (keyof typeof INTERACTIONS)[]) {
      const input = { ...base, interactions: [{ type, bindings: [{ layer: 0, parameter: 'offsetX', input: 'x' }] }] }
      const parsed = assertAurora(input).interactions![0]!
      expect(parsed.activation).toBe(INTERACTION_ACTIVATION.default)
      for (const [key, p] of Object.entries(INTERACTION_CONTROLS)) {
        expect(parsed[key as keyof typeof INTERACTION_CONTROLS]).toBe(p.default)
        for (const value of [p.min, p.max]) expect(() => assertAurora({ ...base, interactions: [{ ...input.interactions[0], [key]: value }] })).not.toThrow()
        for (const value of [p.min - p.step, p.max + p.step]) expect(() => assertAurora({ ...base, interactions: [{ ...input.interactions[0], [key]: value }] })).toThrow(`must be between ${p.min} and ${p.max}`)
      }
      for (const [key, p] of Object.entries(INTERACTION_BINDING_CONTROLS)) {
        expect(parsed.bindings[0]![key as keyof typeof INTERACTION_BINDING_CONTROLS]).toBe(p.default)
        const withBinding = (value: number) => ({ ...base, interactions: [{ type, bindings: [{ layer: 0, parameter: 'offsetX', input: 'x', [key]: value }] }] })
        for (const value of [p.min, p.max]) expect(() => assertAurora(withBinding(value))).not.toThrow()
        for (const value of [p.min - p.step, p.max + p.step]) expect(() => assertAurora(withBinding(value))).toThrow(`must be between ${p.min} and ${p.max}`)
        if (p.step === 1) expect(() => assertAurora(withBinding(p.min + 0.5))).toThrow('must be a whole number')
      }
    }
  })
})
