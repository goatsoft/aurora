import { jsonPath, suggest } from '@goatsoft/aurora-format'
import type { AuroraDocument, FormatIssue } from '@goatsoft/aurora-format'
import { GENERATORS } from './generators/index'

/**
 * Checks what the format can't: that every layer's generator exists and its params are known
 * and in range. Returns issues in the same shape as `parseAurora`.
 */
export function validateDocument(doc: AuroraDocument): FormatIssue[] {
  const issues: FormatIssue[] = []
  const ids = Object.keys(GENERATORS)
  doc.layers.forEach((layer, i) => {
    const generator = GENERATORS[layer.type]
    if (!generator) {
      const hint = suggest(layer.type, ids)
      issues.push({
        path: jsonPath(['layers', i, 'type']),
        message: `is not a known generator.${hint ? ` Did you mean "${hint}"?` : ` Available: ${ids.join(', ')}.`}`,
      })
      return
    }
    const names = Object.keys(generator.params)
    for (const [name, value] of Object.entries(layer.params)) {
      const path = jsonPath(['layers', i, 'params', name])
      const spec = generator.params[name]
      if (!spec) {
        const hint = suggest(name, names)
        issues.push({
          path,
          message: `is not a parameter of ${generator.id}.${hint ? ` Did you mean "${hint}"?` : ` Expected one of: ${names.join(', ')}.`}`,
        })
      } else if (typeof value !== 'number' && typeof value !== 'boolean') {
        issues.push({ path, message: `must be a number, got ${JSON.stringify(value)}.` })
      } else if (typeof value === 'number' && (value < spec.min || value > spec.max)) {
        issues.push({ path, message: `must be between ${spec.min} and ${spec.max}, got ${value}.` })
      }
    }
  })
  return issues
}
