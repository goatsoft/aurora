import type { CssFallback } from './css'
import type { AuroraDocument } from '@goatsoft/aurora-format'

/** What `import hero from './hero.aurora'` gives you with @goatsoft/aurora-unplugin. */
export interface AuroraModule {
  /** The source file, so hot updates reach every surface using it. */
  id: string
  /** The validated document, with defaults filled in. */
  doc: AuroraDocument
  /** The compiled CSS fallback, for server rendering and first paint. */
  css: CssFallback
}

/** A document, or an unplugin module wrapping one. */
export type AuroraSource = AuroraDocument | AuroraModule

export function isAuroraModule(source: AuroraSource): source is AuroraModule {
  return 'doc' in source && 'id' in source
}

export const documentOf = (source: AuroraSource): AuroraDocument => (isAuroraModule(source) ? source.doc : source)

/**
 * A copy of the source's document as plain data. Documents are posted to the rendering worker, and
 * framework state (a Vue `ref` or `reactive`, for one) is a Proxy that can't be posted: the post
 * would throw and take the worker down for every background on the page. Documents are JSON, so
 * a JSON round trip copies them exactly.
 */
export function plainDocument(source: AuroraSource): AuroraDocument {
  return JSON.parse(JSON.stringify(documentOf(source))) as AuroraDocument
}

const hot = new Map<string, Set<(doc: AuroraDocument) => void>>()

/** Registers a surface for hot updates of one module. Returns the unregister function. */
export function watchModule(id: string, update: (doc: AuroraDocument) => void): () => void {
  let set = hot.get(id)
  if (!set) {
    set = new Set()
    hot.set(id, set)
  }
  const current = set
  current.add(update)
  return () => {
    current.delete(update)
    if (!current.size) hot.delete(id)
  }
}

/**
 * Pushes an edited `.aurora` file into every live surface using it, in place: no remount, no flash.
 * The unplugin calls this from its HMR handler; Studio's dev-tool mode does too.
 */
export function hotUpdate(module: AuroraModule): number {
  const surfaces = hot.get(module.id)
  for (const update of surfaces ?? []) update(module.doc)
  return surfaces?.size ?? 0
}
