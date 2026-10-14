---
title: The runtime
description: How Aurora chooses a renderer, what shows first, and how to tune its performance.
order: 4
---

# The runtime

## How Aurora chooses a renderer

Each background tries, in order:

1. **WebGPU in a worker**, through an `OffscreenCanvas`. Rendering runs in a worker where supported, off the main thread.
2. **WebGPU on the main thread**, for browsers without WebGPU in workers.
3. **The CSS fallback**: gradients that approximate the background, compiled from the same layers.

## What shows first

- **An imported file, rendered on the server** (the Vue component with a file imported through the bundler plugin): the server writes the CSS fallback into the HTML, so it is in the first paint.
- **A file loaded by URL** (the custom element, or the Vue component given a URL): the browser fetches the file first, so nothing shows until it has loaded. Then the CSS fallback shows.

In both cases WebGPU replaces the CSS fallback, with a short crossfade, only after its first frame has rendered. The element reports which one it is showing in `data-aurora` (`"webgpu"` or `"css"`).

## Showing WebGPU sooner

Before its first WebGPU frame, a background needs a GPU device, the generators it uses, and its shader compiled. Mounting starts the device and the generator downloads together, and compiling starts as soon as both are ready.

If you know which backgrounds a page shows before they mount, `prepareAurora` does all of that ahead of time, so they show WebGPU as soon as they mount:

```ts
import { prepareAurora } from '@goatsoft/aurora'
import hero from './hero.aurora'

void prepareAurora(hero)
```

Call it as early as you can: in a small script that starts before your app, or when a route starts loading. It does nothing on the server or where the CSS fallback will be used, and calling it again for the same background costs nothing. A GPU started for backgrounds that never mount is released after 10 seconds.

To see where the time goes, open the Performance panel in your browser's developer tools. Aurora adds a mark for each step: `aurora:mount`, `aurora:generators`, `aurora:gpu`, `aurora:attach` and `aurora:frame`, with the background's number in `detail.surface`. Rendering in a worker, the shader compile shows as `aurora:compile` on the worker's track.

## When it stays on CSS

A background stays on its CSS fallback, and says why, when a generator fails to load or isn't registered, or when WebGPU is present but no renderer starts or the renderer stops. Listen for it to log or report it:

- `mountAurora(host, source, { onError })`
- `<AuroraBackground @error="…">`
- the `aurora-error` event on `<aurora-bg>` (which also fires when its file can't be loaded)

A browser without WebGPU isn't an error: the CSS fallback is the expected result there.

## Performance

- One GPU device for the whole page, however many backgrounds it has, and one worker when rendering in a worker.
- One shader per unique layer stack, composed from the generators' WGSL and cached.
- A shared frame budget (30 fps by default), half the device pixel ratio, and a cap on canvas size. Lower resolution reduces rendering work, but can soften fine detail; raise `pixelRatio` if a background needs it.
- Backgrounds pause when they're off screen or the tab is hidden.
- Only `aurora-fbm` ships with the runtime; other generators load the first time a document uses them. Until they have, an imported file shows its precompiled CSS fallback, and a server-rendered `<AuroraBackground>` keeps its fallback on screen.
- With main-thread rendering, the GPU device and its compiled shaders stay ready for 10 seconds after the last background goes, so the next page's background starts quickly. After that they're released.

Change the budgets before mounting anything:

```ts
import { configureAurora } from '@goatsoft/aurora'

configureAurora({ fps: 60, pixelRatio: 1 })
```

| Option | Default | Description |
|---|---|---|
| `fps` | `30` | Shared frame budget across every surface. |
| `maxPixels` | `1280` | Cap on canvas size per axis, in device pixels. |
| `pixelRatio` | `0.5` | Fraction of `devicePixelRatio` to render at; `1` is full device resolution, the most it will use. |
| `touch` | `webgpu` | Use WebGPU on touch devices, or force `css` there. |
| `worker` | `true` | Render in a worker when the browser allows. |

## Colour

Palettes are written in OKLCH, and Aurora blends colours in OKLab rather than sRGB. A gradient between two saturated colours usually keeps more of its colour through the middle than the same gradient blended in sRGB. The canvas renders in Display P3 when the screen supports it, and colours are gamut-mapped to what it can show.

## Reduced motion

Aurora honours `prefers-reduced-motion`. Each file chooses how, with `motion.reduced`: a still frame (the default), a tenth of the speed, or the CSS fallback.

## Playback controls

Pause independently of the visitor's motion preference. A pause keeps the current animation phase and authored speed; resuming continues smoothly from that phase.

```ts
import { mountAurora } from '@goatsoft/aurora'
import hero from './hero.aurora'

const background = mountAurora(host, hero, { paused: true })
background.resume()
background.pause()
console.log(background.paused)
```

Vue accepts `<AuroraBackground :src="hero" :paused="paused" />`, or `useAurora(host, hero, { paused })` with a ref or getter. The custom element accepts `<aurora-bg src="/hero.aurora" paused>` and a boolean `element.paused` property.

Paused backgrounds redraw when their document or size changes, then stop scheduling frames. Documents with `motion.speed: 0` also render only on changes, but freeze the authored clock at zero rather than preserving a live phase. Playback state is temporary: it is never saved in the `.aurora` file or recorded in Studio's undo history. The CSS fallback pauses its drift as well. Reduced-motion preferences still apply while playing.
