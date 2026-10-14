import auroraFollow from '~/presets/interactions/aurora-follow.aurora'
import depthLandscape from '~/presets/interactions/depth-landscape.aurora'
import grabSignal from '~/presets/interactions/grab-the-signal.aurora'
import signalResponse from '~/presets/interactions/signal-response.aurora'
import tapPing from '~/presets/interactions/tap-to-ping.aurora'

export const interactionCards = [
  { id: 'aurora-follow', scene: auroraFollow, kind: 'follow' as const, body: 'Teal and violet light follows you above a still mountain horizon.' },
  { id: 'depth-landscape', scene: depthLandscape, kind: 'follow' as const, body: 'Distant stars, curtains, mountains and trees move at different depths.' },
  { id: 'tap-to-ping', scene: tapPing, kind: 'impulse' as const, body: 'Tap anywhere to send cyan and violet rings through the dark. Four pulses can overlap.' },
  { id: 'grab-the-signal', scene: grabSignal, kind: 'grab' as const, body: 'Pull the display apart, then release it. The signal springs back and settles.' },
  { id: 'signal-response', scene: signalResponse, kind: 'impulse' as const, body: 'Movement creates interference; a tap distorts the signal. Inactivity restores it.' },
]
