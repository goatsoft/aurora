# @goatsoft/color

OKLab and OKLCH colour maths: conversion between sRGB and Display P3, CSS Color 4 gamut mapping, ΔE-OK colour difference, and CSS colour parsing. Zero dependencies.

```sh
npm install @goatsoft/color
```

It's the colour engine behind [Aurora](https://aurora.goatsoft.io), where every colour is authored and blended in OKLab and OKLCH.

## Contrast and transparency

`luminance` and `contrastRatio` calculate WCAG 2 contrast from OKLab colours, gamut-mapped to sRGB. Use `contrastRatio` for opaque colours. For translucent text or backgrounds, use `contrastOn(foreground, background, canvas)` with an opaque canvas colour; it composites the colours before measuring their visible contrast.

```ts
import { contrastOn, parseColor } from '@goatsoft/color'

const ink = parseColor('oklch(0.96 0.01 270)')
const panel = parseColor('oklch(0.2 0.02 270 / 0.9)')
const page = parseColor('#fff')
if (ink.ok && panel.ok && page.ok) {
  const ratio = contrastOn(ink.color, panel.color, page.color)
  // AA normal text: >= 4.5; AA large text: >= 3; AAA normal text: >= 7.
}
```

`compositeOver(foreground, background, space?)` exposes CSS source-over compositing, returning OKLab. The RGB compositing space defaults to `srgb`; `display-p3` is also supported. `contrastOn` measures the sRGB result and requires an opaque canvas, so transparent surfaces never silently assume a light or dark page.

Contrast is a relationship between displayed colours. An OKLab palette alone cannot guarantee the contrast of text over every frame of an animated scene.

## Links

- [Aurora documentation](https://aurora.goatsoft.io/docs)
- [Source on GitHub](https://github.com/goatsoft/aurora/tree/main/packages/color)

## Licence

MIT.
