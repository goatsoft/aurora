import { describe, expect, it } from 'vitest'
import { FORMAT_VERSION, MIGRATIONS, migrate } from '@/index'
import type { Migration } from '@/index'

const issue = (input: unknown) => {
  const result = migrate(input)
  return result.ok ? undefined : result.issues[0]
}

describe('migrate', () => {
  it('passes current documents through', () => {
    const doc = { format: 'aurora', version: FORMAT_VERSION }
    expect(migrate(doc)).toEqual({ ok: true, value: doc, from: FORMAT_VERSION })
    expect(MIGRATIONS).toEqual({})
  })

  it.each([null, [], 'aurora', 3])('rejects %j as not an object', (input) => {
    expect(issue(input)).toEqual({ path: '$', message: 'An .aurora document must be a JSON object.' })
  })

  it('rejects files that are not .aurora', () => {
    expect(issue({ format: 'lottie', version: 1 })).toEqual({ path: '$.format', message: 'must be "aurora". Is this an .aurora file?' })
  })

  it.each(['1', 0, 1.5, undefined])('rejects version %j', (version) => {
    expect(issue({ format: 'aurora', version })).toEqual({ path: '$.version', message: 'must be a whole number, 1 or more.' })
  })

  it('tells you to upgrade for files from the future', () => {
    expect(issue({ format: 'aurora', version: 99 })?.message).toBe(
      `is 99, but this @goatsoft/aurora-format reads up to version ${FORMAT_VERSION}. Upgrade @goatsoft/aurora-format.`,
    )
  })

  const table: Record<number, Migration> = {
    1: (doc) => ({ ...doc, renamed: doc['old'], old: undefined }),
    2: (doc) => ({ ...doc, added: true }),
  }

  it('applies every step in order without mutating the input', () => {
    const input = Object.freeze({ format: 'aurora', version: 1, old: 'x' })
    expect(migrate(input, table, 3)).toEqual({
      ok: true,
      value: { format: 'aurora', version: 3, renamed: 'x', old: undefined, added: true },
      from: 1,
    })
  })

  it('reports a missing step', () => {
    const result = migrate({ format: 'aurora', version: 1 }, { 1: table[1]! }, 3)
    expect(result).toEqual({ ok: false, issues: [{ path: '$.version', message: 'has no migration from version 2 to 3.' }] })
  })
})
