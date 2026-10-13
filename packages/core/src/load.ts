import type { AuroraDocument } from '@goatsoft/aurora-format'
import { AuroraFormatError, parseAurora } from '@goatsoft/aurora-format'
import { validateDocument } from './validate'

/** Loads and validates a `.aurora` file, with every problem named against its URL. */
export async function loadAurora(url: string | URL, init?: RequestInit): Promise<AuroraDocument> {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`Could not load ${String(url)}: ${response.status} ${response.statusText}`.trim())
  const result = parseAurora(await response.text())
  const issues = result.ok ? await validateDocument(result.doc) : result.issues
  if (issues.length || !result.ok) throw new AuroraFormatError(issues, String(url))
  return result.doc
}
