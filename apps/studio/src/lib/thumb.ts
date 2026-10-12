import { compileCss } from '@goatsoft/aurora'
import type { Generator } from '@goatsoft/aurora'
import { assertAurora } from '@goatsoft/aurora-format'
import type { AuroraDocument, AuroraLayer } from '@goatsoft/aurora-format'

/** A CSS-fallback thumbnail of one layer of a document: instant, and no GPU context per row. */
export function layerThumb(doc: AuroraDocument, { mask: _, ...layer }: AuroraLayer): string {
  return compileCss({ ...doc, canvas: { ...doc.canvas, fade: 'none' }, layers: [{ ...layer, opacity: 1 }] }).style
}

const generatorThumbs = new Map<string, string>()

/** A generator's look with its own palette and defaults, for the picker. */
export function generatorThumb(generator: Generator): string {
  let style = generatorThumbs.get(generator.id)
  if (style === undefined) {
    const doc = assertAurora({ format: 'aurora', version: 1, name: generator.id, palette: [...generator.palette], layers: [{ type: generator.id }] })
    style = compileCss(doc).style
    generatorThumbs.set(generator.id, style)
  }
  return style
}
