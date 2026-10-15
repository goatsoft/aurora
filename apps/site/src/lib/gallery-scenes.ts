import type { AuroraModule } from '@goatsoft/aurora'
import { preset } from '@/lib/presets'

const modules = import.meta.glob<AuroraModule>('~/presets/scenes/*.aurora', { eager: true, import: 'default' })
const scene = (id: string) => preset(modules, id, 'scene')

/** Finished compositions: each multi-layer preset appears once, grouped by atmosphere. */
export const sceneGroups = [
  {
    id: 'night-skies', name: 'Night skies', description: 'Aurora curtains, distant stars and silhouettes at the edge of night.',
    scenes: [
      { id: 'borealis', body: 'Green and magenta curtains above a dark forest, with stars behind the light.' },
      { id: 'northern-lights', body: 'A luminous green horizon opens into violet rays and a deep starfield.' },
      { id: 'polar-night', body: 'Teal and violet ribbons drift over a mountain ridge.' },
      { id: 'glacier-night', body: 'A mountain landscape under an aurora, framed by a dark treeline.' },
    ],
  },
  {
    id: 'landscapes', name: 'Landscapes & weather', description: 'Layered horizons, changing weather and light moving through water.',
    scenes: [
      { id: 'glacier-storm', body: 'Rain and lightning pass over mountains and trees in a layered storm.' },
      { id: 'misty-forest', body: 'Three depths of spruce fade into a pale, misty morning.' },
      { id: 'lagoon', body: 'Caustic light dances over a slowly shifting turquoise colour field.' },
      { id: 'blue-hour', body: 'Mountain ridges recede into a soft dusk gradient.' },
      { id: 'glacier', body: 'A clear mountain landscape with a forest in the foreground.' },
    ],
  },
  {
    id: 'tech-scenes', name: 'Tech & signals', description: 'Digital rain, radar echoes and the textures of a failing display.',
    scenes: [
      { id: 'signal-lost', body: 'Fractured cyan and magenta signals, electronic static, scan lines and a soft phosphor lattice.' },
      { id: 'deep-scan', body: 'Radar contacts and expanding pulses emerge from a dark blue colour field.' },
      { id: 'ghost-terminal', body: 'Green glyphs fall through the dark with a fine layer of electronic interference.' },
      { id: 'echo-chamber', body: 'Two offset sources send cyan and violet pulses across a drifting gradient.' },
      { id: 'night-protocol', body: 'Sparse cyan glyphs descend over a slow violet mesh gradient.' },
    ],
  },
].map((group) => ({ ...group, scenes: group.scenes.map((item) => ({ ...item, scene: scene(item.id) })) }))
