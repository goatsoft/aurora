import { toJsonSchema } from '@valibot/to-json-schema'
import { ESLint } from 'eslint'
import fc from 'fast-check'
import ts from 'typescript'
import * as v from 'valibot'
import { describe, expect, inject, it } from 'vitest'
import interactionSource from '@/interactions-schema.ts?raw'
import { toFormatIssue } from '@/issues'
import modifierSource from '@/modifiers-schema.ts?raw'
import rangeSource from '@/range.ts?raw'
import { AuroraValidationSchema } from '@/runtime-schema'
import { AuroraSchema } from '@/schema'
import schemaSource from '@/schema.ts?raw'
import { literal, runtimeSchema } from './codegen'

type JsonObject = Record<string, unknown>
const root = inject('root')
const formatter = new ESLint({ cwd: root, fix: true })

/** Compare schema constraints separately from editor-only metadata. */
function rules(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(rules)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['description', 'title', 'examples'].includes(key)).map(([key, item]) => [key, rules(item)]))
  return value
}

describe('runtime schema generation', () => {
  it('generates lean validators without changing authoring constraints', async () => {
    for (const [source, target, authored] of [['schema.ts', 'runtime-schema.ts', schemaSource], ['modifiers-schema.ts', 'runtime-modifiers.ts', modifierSource], ['interactions-schema.ts', 'runtime-interactions.ts', interactionSource], ['range.ts', 'runtime-range.ts', rangeSource]] as const) {
      const text = runtimeSchema(authored, source)
      const [formatted] = await formatter.lintText(text, { filePath: `${root}/packages/format/src/${target}` })
      expect(formatted!.messages.filter((message) => message.severity === 2)).toEqual([])
      await expect(formatted!.output ?? text).toMatchFileSnapshot(`${root}/packages/format/src/${target}`)
    }
  }, 30_000)
  it('preserves every JSON Schema rule and the full public authoring descriptions', () => {
    const options = { errorMode: 'ignore', typeMode: 'input' } as const
    const authoring = toJsonSchema(AuroraSchema, options)
    const runtime = toJsonSchema(AuroraValidationSchema, options)
    expect(rules(runtime)).toEqual(rules(authoring))
    expect(JSON.stringify(runtime)).not.toContain('"description"')
    const properties = (authoring as JsonObject)['properties'] as JsonObject
    expect(properties['palette']).toHaveProperty('description', 'Colours referenced by layers, by index.')
  })
  it('preserves parse results and exact diagnostics for arbitrary JSON values', () => {
    const base = { format: 'aurora', version: 1, name: 'T', palette: ['#fff'], layers: [{ type: 'aurora-fbm' }] }
    const compare = (input: unknown) => {
      const authoring = v.safeParse(AuroraSchema, input)
      const runtime = v.safeParse(AuroraValidationSchema, input)
      expect(runtime.success).toBe(authoring.success)
      if (authoring.success && runtime.success) expect(runtime.output).toEqual(authoring.output)
      if (!authoring.success && !runtime.success) expect(runtime.issues.map((issue) => toFormatIssue(issue, AuroraValidationSchema, input))).toEqual(authoring.issues.map((issue) => toFormatIssue(issue, AuroraSchema, input)))
    }
    for (const input of [base, { ...base, palette: ['rgb(1 2 3)'] }, { ...base, palette: [5] },
      { ...base, fallback: { mode: 'css', layers: ['linear-gradient(red, blue)'] } },
      { ...base, fallback: { mode: 'css', layers: ['url(example.png)'] } }]) compare(input)
    fc.assert(fc.property(fc.jsonValue(), (input) => {
      compare(input)
    }))
    fc.assert(fc.property(fc.record({ amount: fc.double({ min: 0, max: 1, noNaN: true }), frequency: fc.double({ min: 0, max: 2, noNaN: true }), seed: fc.integer({ min: 0, max: 100 }) }), (signal) => {
      compare({ ...base, modifiers: { signal } })
    }))
  })
  it('emits valid literals which round-trip punctuation, Unicode and line breaks', () => {
    const cases = ['The scene\'s colours.', 'A \\ B\n"quoted"\r\ntext\t🙂\u2028\u2029', '', ...fc.sample(fc.string(), 50)]
    for (const text of cases) {
      const code = `const description = ${literal(text)}`
      expect(ts.transpileModule(code, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2023 } }).diagnostics).toEqual([])
      const source = ts.createSourceFile('description.ts', code, ts.ScriptTarget.Latest)
      const declaration = (source.statements[0] as ts.VariableStatement).declarationList.declarations[0]!
      expect((declaration.initializer as ts.StringLiteral).text).toBe(text)
    }
  })
})
