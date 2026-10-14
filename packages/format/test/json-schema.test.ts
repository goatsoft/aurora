import { toJsonSchema } from '@valibot/to-json-schema'
import { describe, expect, inject, it } from 'vitest'
import { AuroraSchema, SCHEMA_URL } from '@/index'

/** The published JSON Schema. Regenerate with `pnpm test -u` after changing the Valibot schema. */
function buildJsonSchema() {
  const { $schema, title, description, ...rest } = toJsonSchema(AuroraSchema, { errorMode: 'ignore', typeMode: 'input' })
  const schema = { $schema, $id: SCHEMA_URL, title, description, ...rest } as JsonObject
  // Colour syntax is checked by a custom action, which JSON Schema can't see; a pattern catches the common slips.
  const palette = (schema['properties'] as JsonObject)['palette'] as JsonObject
  // Editor examples belong in the published schema, not in the runtime validator bundle.
  palette['items'] = { ...(palette['items'] as JsonObject), examples: ['oklch(0.68 0.16 245)', 'oklch(0.56 0.22 285 / 0.8)', '#4f8cff'], pattern: '^\\s*(#|oklch\\(|oklab\\(|color\\()' }
  return schema
}

type JsonObject = Record<string, unknown>

describe('JSON Schema', () => {
  it('matches the published schema/v1.json', async () => {
    await expect(`${JSON.stringify(buildJsonSchema(), null, 2)}\n`).toMatchFileSnapshot(`${inject('root')}/packages/format/schema/v1.json`)
  })

  it('documents fields for editor hovers and lists the options', () => {
    const schema = buildJsonSchema() as { properties: Record<string, { description?: string }> }
    expect(schema.properties['palette']?.description).toBe('Colours referenced by layers, by index.')
    expect(JSON.stringify(schema)).toContain('"enum":["normal","screen","add","multiply","overlay"]')
  })
})
