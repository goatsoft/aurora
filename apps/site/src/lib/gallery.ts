import type { AuroraModule } from '@goatsoft/aurora'
import { blueHour, glacierStorm, mistyForest } from '@/lib/scenes'

const starters = import.meta.glob<AuroraModule>('~/presets/starters/*.aurora', { eager: true, import: 'default' })
const starter = (id: string) => Object.entries(starters).find(([path]) => path.endsWith(`/${id}.aurora`))![1]

/** Cards that show their generator inside a scene rather than alone. */
const SCENES: Record<string, AuroraModule> = { mountains: blueHour, treeline: mistyForest, rain: glacierStorm }

const cards = [
  { id: 'aurora-fbm', name: 'Aurora', kind: 'Aurora', body: 'Drifting ribbons of light. This is the original Aurora shader.' },
  { id: 'curtain', name: 'Curtain', kind: 'Aurora', body: 'Hanging curtains with rays that rise from a bright lower edge.' },
  { id: 'starfield', name: 'Starfield', kind: 'Night sky', body: 'Three depths of stars, a milky way and the odd meteor.' },
  { id: 'linear-gradient', name: 'Linear gradient', kind: 'Gradients', body: 'Two to four colours along an angle, like CSS linear-gradient().' },
  { id: 'conic', name: 'Conic', kind: 'Gradients', body: 'Colours turning slowly around a point.' },
  { id: 'mesh-gradient', name: 'Mesh gradient', kind: 'Gradients', body: 'Four colours that drift and blend.' },
  { id: 'clouds', name: 'Clouds', kind: 'Air', body: 'Cumulus at two depths, lit from one side.' },
  { id: 'rain', name: 'Rain', kind: 'Air', body: 'Rain in three depths, leaning with the wind. Shown here in a storm with lightning.' },
  { id: 'lightning', name: 'Lightning', kind: 'Air', body: 'Forked bolts and sky flashes, every few seconds.' },
  { id: 'wind', name: 'Wind', kind: 'Air', body: 'Thin streaks that bend in the gusts.' },
  { id: 'mountains', name: 'Mountains', kind: 'Earth', body: 'Ridges that fade into haze. Shown here over a linear gradient.' },
  { id: 'treeline', name: 'Treeline', kind: 'Earth', body: 'Rows of spruce silhouettes, fading into the mist behind them.' },
  { id: 'strata', name: 'Strata', kind: 'Earth', body: 'Folded sandstone layers.' },
  { id: 'water', name: 'Water', kind: 'Water', body: 'Light patterns on the floor of clear water.' },
  { id: 'fire', name: 'Fire', kind: 'Fire', body: 'Flames and rising embers.' },
  { id: 'linear-sweep', name: 'Linear sweep', kind: 'Gradients', body: 'A soft band of colour sweeping across the canvas.' },
  { id: 'grain', name: 'Grain', kind: 'Gradients', body: 'A fine texture to soften clean gradients.' },
  { id: 'digital-rain', name: 'Digital rain', kind: 'Tech', body: 'Glowing columns of procedural glyphs falling through the dark.' },
  { id: 'glitch', name: 'Glitch', kind: 'Tech', body: 'Broken signal bands with bursts of cyan and magenta.' },
  { id: 'static', name: 'Static', kind: 'Tech', body: 'Electronic noise, rolling interference and signal dropout.' },
  { id: 'radar', name: 'Radar', kind: 'Tech', body: 'A luminous sweep revealing contacts on a circular grid.' },
  { id: 'ping', name: 'Ping', kind: 'Tech', body: 'Expanding rings of light from a point you choose.' },
  { id: 'scanlines', name: 'Scan lines', kind: 'Tech', body: 'A soft CRT raster with a slowly travelling exposure band.' },
  { id: 'phosphor', name: 'Phosphor', kind: 'Tech', body: 'A glowing display-dot lattice with drifting cyan and violet light.' },
].map((card) => ({ ...card, scene: SCENES[card.id] ?? starter(card.id) }))

/** The gallery follows the same families as Studio's generator picker. */
export const galleryGroups = [
  { id: 'aurora', name: 'Aurora', description: 'Ribbons, curtains and star-filled skies.', kinds: ['Aurora', 'Night sky'] },
  { id: 'elements', name: 'Elements', description: 'Weather, landscapes, water and fire.', kinds: ['Air', 'Earth', 'Water', 'Fire'] },
  { id: 'gradients', name: 'Gradients', description: 'Colour in motion, from a quiet wash to a sweeping beam.', kinds: ['Gradients'] },
  { id: 'tech', name: 'Tech', description: 'Digital rain, broken signals and luminous scans.', kinds: ['Tech'] },
].map(({ kinds, ...group }) => ({ ...group, cards: cards.filter((card) => kinds.includes(card.kind)) }))
