import { relative } from 'node:path'
import { compileCss, validateDocument } from '@goatsoft/aurora'
import type { AuroraModule } from '@goatsoft/aurora'
import { parseAurora } from '@goatsoft/aurora-format'
import { jsonLocations, locate, offsetToLocation } from './locate'
import type { Location } from './locate'

/** A build error that points at the exact place in the `.aurora` file. */
export class AuroraBuildError extends Error {
  override name = 'AuroraBuildError'
  constructor(message: string, readonly id: string, readonly loc: Location & { file: string }) {
    super(message)
  }
}

/** Where a JSON.parse message says the problem is (V8 reports a position, sometimes a line and column). */
function syntaxLocation(text: string, message: string): Location {
  const lineColumn = /line (\d+) column (\d+)/.exec(message)
  if (lineColumn) return { line: Number(lineColumn[1]), column: Number(lineColumn[2]) - 1 }
  const position = /position (\d+)/.exec(message)
  return position ? offsetToLocation(text, Number(position[1])) : { line: 1, column: 0 }
}

/**
 * Turns a `.aurora` file into a JS module exporting `{ id, doc, css }`, or throws an
 * AuroraBuildError naming every problem with its line and column. `root` keeps ids relative,
 * so no absolute paths end up in the bundle.
 */
export async function transformAurora(text: string, file: string, root: string): Promise<string> {
  const name = relative(root, file) || file
  const result = parseAurora(text)
  const issues = result.ok ? await validateDocument(result.doc) : result.issues
  if (!result.ok || issues.length) {
    const map = jsonLocations(text)
    const located = issues.map((issue) => ({
      ...issue,
      loc: issue.path === '$' && issue.message.startsWith('is not valid JSON') ? syntaxLocation(text, issue.message) : locate(text, issue.path, map),
    }))
    const lines = located.map(({ path, message, loc }) => `  ${name}:${loc.line}:${loc.column + 1}  ${path} ${message}`)
    const first = located[0]!.loc
    throw new AuroraBuildError(`Invalid .aurora file ${name}:\n${lines.join('\n')}`, file, { ...first, file })
  }

  const module: AuroraModule = { id: name, doc: result.doc, css: compileCss(result.doc) }
  return `const aurora = ${JSON.stringify(module)}
export default aurora
if (import.meta.hot) {
  import.meta.hot.accept((next) => {
    if (next) import('@goatsoft/aurora').then(({ hotUpdate }) => hotUpdate(next.default))
  })
}
`
}
