import type { FormatIssue } from './issues'
import type { AuroraDocument, AuroraInput } from './schema'
import * as v from 'valibot'
import { AuroraFormatError, jsonPath, toFormatIssue } from './issues'
import { migrate } from './migrate'
import { AuroraSchema, SCHEMA_URL } from './schema'

export type ParseResult
  = | { ok: true, doc: AuroraDocument, sourceVersion: number }
    | { ok: false, issues: FormatIssue[] }

/**
 * Validates an `.aurora` document (a JSON string or parsed value), migrating older versions first.
 * Never throws: every problem comes back as an issue with a JSONPath. On success, `sourceVersion`
 * is the version the file was written in, so tools can offer to save it upgraded.
 */
export function parseAurora(input: unknown): ParseResult {
  let value = input
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input)
    } catch (error) {
      return { ok: false, issues: [{ path: '$', message: `is not valid JSON: ${(error as Error).message}` }] }
    }
  }

  const migrated = migrate(value)
  if (!migrated.ok) return migrated

  const result = v.safeParse(AuroraSchema, migrated.value)
  if (!result.success) {
    return { ok: false, issues: result.issues.map((issue) => toFormatIssue(issue, AuroraSchema, migrated.value)) }
  }

  const issues = checkReferences(result.output)
  if (issues.length) return { ok: false, issues }
  return { ok: true, doc: result.output, sourceVersion: migrated.from }
}

/** Like `parseAurora`, but throws an `AuroraFormatError` listing every issue. */
export function assertAurora(input: unknown, source?: string): AuroraDocument {
  const result = parseAurora(input)
  if (!result.ok) throw new AuroraFormatError(result.issues, source)
  return result.doc
}

/** Cross-field rules a schema can't express: layer colour indices must exist in the palette. */
function checkReferences(doc: AuroraDocument): FormatIssue[] {
  const issues: FormatIssue[] = []
  const size = doc.palette.length
  doc.layers.forEach((layer, i) => {
    layer.colors.forEach((index, j) => {
      if (index >= size) {
        issues.push({
          path: jsonPath(['layers', i, 'colors', j]),
          message: `is ${index}, but the palette only has ${size === 1 ? '1 colour (index 0)' : `${size} colours (0–${size - 1})`}.`,
        })
      }
    })
  })
  return issues
}

/**
 * Identity helper for authoring documents in TypeScript: full autocomplete and type checking,
 * with optional fields left optional. Validate with `assertAurora` before use.
 */
export function defineAurora(doc: Omit<AuroraInput, 'format' | 'version'> & Partial<Pick<AuroraInput, 'format' | 'version'>>): AuroraInput {
  return { $schema: SCHEMA_URL, format: 'aurora', version: 1, ...doc }
}

const KEY_ORDER = ['$schema', 'format', 'version', 'name', 'canvas', 'motion', 'palette', 'layers', 'fallback']

/** Serialises a document as stable, human-friendly JSON: canonical key order, 2-space indent, trailing newline. */
export function stringifyAurora(doc: AuroraDocument | AuroraInput): string {
  const ordered: Record<string, unknown> = { $schema: SCHEMA_URL }
  for (const key of KEY_ORDER) if (key in doc) ordered[key] = (doc as Record<string, unknown>)[key]
  return `${JSON.stringify(ordered, null, 2)}\n`
}
