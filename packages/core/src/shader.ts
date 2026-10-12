import type { RgbSpace } from '@goatsoft/color'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import { compose as composeWith } from './compose'
import type { ComposedShader } from './compose'
import { GENERATORS } from './generators/index'

/** Composes a document's shader with the built-in and registered generators. */
export function compose(doc: AuroraDocument, output: RgbSpace = 'srgb'): ComposedShader {
  return composeWith(doc, output, (id) => GENERATORS[id])
}
