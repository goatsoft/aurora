import type { AuroraDocument, FormatIssue } from '@goatsoft/aurora-format'
import { jsonPath, suggest } from '@goatsoft/aurora-format'
import { generatorIds, GENERATORS, loadGenerators } from './generators/index'

/**
 * Checks what the format can't: that every layer's generator exists and its params are known
 * and in range, loading the built-in generators the document uses. Returns issues in the same
 * shape as `parseAurora`.
 */
export async function validateDocument(doc: AuroraDocument): Promise<FormatIssue[]> {
  await loadGenerators(doc.layers.map((layer) => layer.type))
  return checkDocument(doc)
}

/**
 * `validateDocument` without loading anything: checks against the generators loaded so far, so a
 * built-in that hasn't loaded yet counts as unknown. For editors that have loaded every generator
 * and need an answer on every keystroke.
 */
export function checkDocument(doc: AuroraDocument): FormatIssue[] {
  const issues: FormatIssue[] = []
  const ids = generatorIds()
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
  doc.interactions?.forEach((interaction, i) => {
    interaction.bindings.forEach((binding, j) => {
      const path = jsonPath(['interactions', i, 'bindings', j])
      if (binding.parameter.startsWith('signal.')) {
        if (!doc.modifiers?.signal) issues.push({ path: `${path}.parameter`, message: 'requires a signal modifier in $.modifiers.signal.' })
        else if (!['amount', 'shake', 'tearSize', 'separation', 'tracking', 'frequency', 'seed'].includes(binding.parameter.slice(7))) issues.push({ path: `${path}.parameter`, message: `is not a signal control: ${JSON.stringify(binding.parameter)}.` })
        return
      }
      const layer = binding.layer === undefined ? undefined : doc.layers[binding.layer]
      if (!layer) {
        issues.push({ path: `${path}.layer`, message: `must reference an existing layer (0–${doc.layers.length - 1}).` })
        return
      }
      const generator = GENERATORS[layer.type]
      if (generator && !['opacity', 'offsetX', 'offsetY', 'time'].includes(binding.parameter) && !(binding.parameter in generator.params)) {
        const hint = suggest(binding.parameter, Object.keys(generator.params))
        issues.push({ path: `${path}.parameter`, message: `is not a parameter of ${generator.id}.${hint ? ` Did you mean "${hint}"?` : ''}` })
      }
    })
  })
  return issues
}
