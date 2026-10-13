import type { FormatIssue } from './issues'
import { FORMAT_ID, FORMAT_VERSION } from './schema'

/** Upgrades a document from version `n` to `n + 1`. It must not mutate its input. */
export type Migration = (doc: Readonly<Record<string, unknown>>) => Record<string, unknown>

/**
 * Forward migrations, keyed by the version they upgrade *from*. When `FORMAT_VERSION` is bumped,
 * add the step from the previous version here; never edit a shipped migration.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {}

export type MigrateResult
  = | { ok: true, value: Record<string, unknown>, from: number }
    | { ok: false, issues: FormatIssue[] }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Checks a document's identity and brings it up to `target` (the current version by default). */
export function migrate(
  input: unknown,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = FORMAT_VERSION,
): MigrateResult {
  const issue = (path: string, message: string): MigrateResult => ({ ok: false, issues: [{ path, message }] })
  if (!isRecord(input)) return issue('$', 'An .aurora document must be a JSON object.')
  if (input['format'] !== FORMAT_ID) {
    return issue('$.format', `must be "${FORMAT_ID}". Is this an .aurora file?`)
  }
  const from = input['version']
  if (typeof from !== 'number' || !Number.isInteger(from) || from < 1) {
    return issue('$.version', 'must be a whole number, 1 or more.')
  }
  if (from > target) {
    return issue(
      '$.version',
      `is ${from}, but this @goatsoft/aurora-format reads up to version ${target}. Upgrade @goatsoft/aurora-format.`,
    )
  }

  let doc = input
  for (let version = from; version < target; version++) {
    const step = migrations[version]
    if (!step) return issue('$.version', `has no migration from version ${version} to ${version + 1}.`)
    doc = { ...step(doc), version: version + 1 }
  }
  return { ok: true, value: doc, from }
}
