---
title: The runtime
description: How Aurora renders, falls back, and stays light on the page.
order: 4
---

# The runtime

## The fallback ladder

Each background tries, in order:

1. **WebGPU in a worker**, through an `OffscreenCanvas`, so rendering never blocks your page.
2. **WebGPU on the main thread**, for browsers without WebGPU in workers.
3. **The CSS fallback**: OKLab gradients compiled from the same layers.

The CSS fallback paints first, always. WebGPU crossfades in only once a real frame is on screen, and the element reports which mode it's in truthfully (`data-aurora="webgpu"` or `"css"`).

## Staying light

- One GPU device and one worker for the whole page, however many backgrounds it has.
- One shader per unique layer stack, composed from the generators' WGSL and cached.
- A shared frame budget (30 fps by default), half the device pixel ratio, and a cap on canvas size. Backgrounds are soft, so this is indistinguishable and much cheaper.
- Backgrounds pause when they're off-screen or the tab is hidden.
- Only `aurora-fbm` ships with the runtime; other generators load the first time a document uses them.

Change the budgets before mounting anything:

```ts
import { configureAurora } from '@goatsoft/aurora'

configureAurora({ fps: 60, pixelRatio: 1 })
```

| Option | Default | |
|---|---|---|
| `fps` | `30` | Shared frame budget across every surface. |
| `maxPixels` | `1280` | Cap on canvas size per axis, in device pixels. |
| `pixelRatio` | `0.5` | Fraction of `devicePixelRatio` to render at. |
| `touch` | `webgpu` | Use WebGPU on touch devices, or force `css` there. |
| `worker` | `true` | Render in a worker when the browser allows. |

## Colour

Palettes are authored in OKLCH and blended in OKLab, so gradients keep their chroma through the middle instead of going grey. The canvas renders in Display P3 when the screen supports it, and colours are gamut-mapped to what it can show.

## Reduced motion

Aurora honours `prefers-reduced-motion`. Each file chooses how, with `motion.reduced`: a still frame (the default), a tenth of the speed, or the CSS fallback.
