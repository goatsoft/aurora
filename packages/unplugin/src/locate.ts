import { jsonPath } from '@goatsoft/aurora-format'

/**
 * Maps every JSONPath in a JSON text to the offset where it starts: a property's key, or an array
 * item's value. Tolerates malformed input by returning what it read before the problem.
 */
export function jsonLocations(text: string): Map<string, number> {
  const map = new Map<string, number>()
  let i = 0
  const ws = () => {
    while (i < text.length && /\s/.test(text[i]!)) i++
  }
  const string = (): string => {
    const start = ++i
    while (i < text.length && text[i] !== '"') i += text[i] === '\\' ? 2 : 1
    const raw = text.slice(start, i++)
    try {
      return JSON.parse(`"${raw}"`) as string
    } catch {
      return raw
    }
  }
  const value = (keys: (string | number)[]): void => {
    ws()
    const path = jsonPath(keys)
    if (!map.has(path)) map.set(path, i)
    const c = text[i]
    if (c === '{') {
      i++
      for (;;) {
        ws()
        if (text[i] !== '"') break
        const at = i
        const key = string()
        map.set(jsonPath([...keys, key]), at)
        ws()
        if (text[i] !== ':') return
        i++
        value([...keys, key])
        ws()
        if (text[i] !== ',') break
        i++
      }
      if (text[i] === '}') i++
    } else if (c === '[') {
      i++
      for (let index = 0; ; index++) {
        ws()
        if (text[i] === ']' || i >= text.length) break
        value([...keys, index])
        ws()
        if (text[i] !== ',') break
        i++
      }
      if (text[i] === ']') i++
    } else if (c === '"') {
      string()
    } else {
      while (i < text.length && !/[\s,\]}]/.test(text[i]!)) i++
    }
  }
  value([])
  return map
}

export interface Location {
  /** 1-based. */
  line: number
  /** 0-based, as Rollup and Vite expect. */
  column: number
}

export function offsetToLocation(text: string, offset: number): Location {
  const before = text.slice(0, offset)
  const line = before.split('\n').length
  return { line, column: offset - (before.lastIndexOf('\n') + 1) }
}

/** Where a JSONPath points in the text, falling back to the nearest ancestor that exists. */
export function locate(text: string, path: string, map = jsonLocations(text)): Location {
  let current = path
  for (;;) {
    const offset = map.get(current)
    if (offset !== undefined) return offsetToLocation(text, offset)
    const parent = current.replace(/(\.[^.[\]]+|\[[^\]]*\])$/, '')
    if (parent === current) return { line: 1, column: 0 }
    current = parent
  }
}
