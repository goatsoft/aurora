import type { Doc } from '@/editor/document'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import { parseAurora } from '@goatsoft/aurora-format'

// Read as text, so presets open exactly as authored (and export byte-identical).
const scenes = import.meta.glob<string>('~/presets/scenes/*.aurora', { query: '?raw', import: 'default', eager: true })
const classic = import.meta.glob<string>('~/presets/classic/*.aurora', { query: '?raw', import: 'default', eager: true })
const mono = import.meta.glob<string>('~/presets/mono/*.aurora', { query: '?raw', import: 'default', eager: true })
const starters = import.meta.glob<string>('~/presets/starters/*.aurora', { query: '?raw', import: 'default', eager: true })

export interface Preset {
  id: string
  name: string
  input: Doc
  doc: AuroraDocument
}

function pack(files: Record<string, string>): Preset[] {
  return Object.entries(files).flatMap(([path, text]) => {
    const result = parseAurora(text)
    if (!result.ok) return []
    return [{ id: path.replace(/^.*\/presets\//, '').replace(/\.aurora$/, ''), name: result.doc.name, input: JSON.parse(text) as Doc, doc: result.doc }]
  })
}

/** The galleries Studio ships: art-directed scenes, the classic presets (the parity reference), GOATsoft's monochrome auroras and one starter per generator. */
export const PACKS = [
  { id: 'scenes', label: 'Scenes', description: 'Art-directed, multi-layer', presets: pack(scenes) },
  { id: 'classic', label: 'Classic pack', description: 'The original eight backgrounds, bit-exact', presets: pack(classic) },
  { id: 'mono', label: 'GOATsoft mono', description: 'Grayscale mist, dark and light', presets: pack(mono) },
  { id: 'starters', label: 'Starters', description: 'One per generator', presets: pack(starters) },
]
