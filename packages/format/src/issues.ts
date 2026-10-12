import type * as v from 'valibot'

/** One problem in a document. `path` is a JSONPath such as `$.layers[0].opacity`. */
export interface FormatIssue {
  path: string
  message: string
}

/** Thrown by `assertAurora`. Its message lists every issue, one per line. */
export class AuroraFormatError extends Error {
  override name = 'AuroraFormatError'
  readonly issues: readonly FormatIssue[]

  constructor(issues: readonly FormatIssue[], source?: string) {
    const where = source ? ` in ${source}` : ''
    super(`Invalid .aurora document${where}:\n${issues.map((i) => `  ${i.path} ${i.message}`).join('\n')}`)
    this.issues = issues
  }
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

export function jsonPath(keys: readonly (string | number)[]): string {
  return keys.reduce<string>(
    (path, key) =>
      typeof key === 'number' ? `${path}[${key}]` : IDENTIFIER.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`,
    '$',
  )
}

/** Levenshtein distance, for "did you mean" suggestions. */
export function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    previous = current
  }
  return previous[b.length]!
}

/** The closest candidate to `input`, if it is plausibly a typo of it. */
export function suggest(input: string, candidates: readonly string[]): string | undefined {
  let best: string | undefined
  let bestDistance = Infinity
  for (const candidate of candidates) {
    const d = distance(input.toLowerCase(), candidate.toLowerCase())
    if (d < bestDistance) {
      best = candidate
      bestDistance = d
    }
  }
  return bestDistance <= Math.max(1, Math.floor(input.length / 3)) && bestDistance < input.length ? best : undefined
}

/** The structural parts of a Valibot schema that `keysAt` walks. */
interface SchemaNode {
  entries?: Record<string, SchemaNode>
  wrapped?: SchemaNode
  item?: SchemaNode
  value?: SchemaNode
  options?: readonly SchemaNode[]
  pipe?: readonly SchemaNode[]
  key?: string
  literal?: unknown
}

/** Walks a schema along a path in the input, to find the object keys valid at that point. */
export function keysAt(schema: v.GenericSchema, input: unknown, keys: readonly (string | number)[]): string[] {
  let node = schema as SchemaNode | undefined
  let value = input
  for (let i = 0; ;) {
    if (!node) return []
    if (node.pipe) node = node.pipe[0]
    else if (node.wrapped) node = node.wrapped
    else if (node.options && node.key) {
      const discriminator = (value as Record<string, unknown>)[node.key]
      const key = node.key
      node = node.options.find((option) => option.entries?.[key]?.literal === discriminator)
    } else if (i === keys.length) return Object.keys(node.entries ?? {})
    else {
      const key = keys[i++]!
      value = (value as Record<string | number, unknown>)[key]
      node = node.entries ? node.entries[key] : node.item ?? node.value
    }
  }
}

/** Turns a Valibot issue into a FormatIssue with a JSONPath and, where it helps, a suggestion. */
export function toFormatIssue(issue: v.BaseIssue<unknown>, schema: v.GenericSchema, input: unknown): FormatIssue {
  const keys = (issue.path ?? []).map((item) => item.key as string | number)
  const path = jsonPath(keys)
  const last = keys.at(-1)

  // Unknown key from strictObject: suggest the nearest valid key.
  if (issue.type === 'strict_object' && issue.expected === 'never' && typeof last === 'string') {
    const valid = keysAt(schema, input, keys.slice(0, -1))
    const hint = suggest(last, valid)
    return { path, message: `is not a known key.${hint ? ` Did you mean "${hint}"?` : ` Expected one of: ${valid.join(', ')}.`}` }
  }
  if (issue.received === 'undefined' && issue.kind === 'schema') {
    return { path, message: 'is required.' }
  }
  // Picklist and variant-discriminator mismatches: list the options and suggest the nearest.
  if (issue.type === 'picklist' || issue.type === 'variant') {
    const options = [...issue.expected!.matchAll(/"([^"]*)"/g)].map((m) => m[1]!)
    const hint = typeof issue.input === 'string' ? suggest(issue.input, options) : undefined
    return {
      path,
      message: `must be ${options.map((o) => `"${o}"`).join(' | ')}, got ${issue.received}.${hint ? ` Did you mean "${hint}"?` : ''}`,
    }
  }
  if (issue.kind === 'schema') return { path, message: `must be ${article(issue.expected!)}, got ${issue.received}.` }
  return { path, message: /[.?!]$/.test(issue.message) ? issue.message : `${issue.message}.` }
}

const article = (expected: string) => (/^(Object|Array)$/.test(expected) ? `an ${expected.toLowerCase()}` : `a ${expected}`)
