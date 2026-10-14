import pixelate from '@/backgrounds/modifier-pixelate.aurora'
import signal from '@/backgrounds/modifier-signal.aurora'
import vignette from '@/backgrounds/modifier-vignette.aurora'

/** Scene-wide finishes, shown on complete compositions. */
export const modifierCards = [
  { id: 'signal', name: 'Signal distortion', scene: signal, body: 'Stretching bands, tracking slips and separated colour turn any scene into a broken display.' },
  { id: 'pixelate', name: 'Pixelate', scene: pixelate, body: 'Turn light, landscape and every layer into crisp display blocks.' },
  { id: 'vignette', name: 'Vignette', scene: vignette, body: 'Softly darken the edges and bring the whole composition into focus.' },
]
