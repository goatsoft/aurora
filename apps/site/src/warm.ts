import { prepareAurora } from '@goatsoft/aurora'
import borealis from '~/presets/scenes/borealis.aurora'
import glacierNight from '~/presets/scenes/glacier-night.aurora'

// Starts at once, unlike the app, which gruff starts when the page is idle (the site's Vite config
// builds this as its own entry, marked data-eager). While the rest of the JavaScript downloads, it
// starts the GPU and compiles the landing page's first two backgrounds, so they show WebGPU as
// soon as the app mounts them.
if (location.pathname === '/') void prepareAurora(borealis, glacierNight)
