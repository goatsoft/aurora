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
