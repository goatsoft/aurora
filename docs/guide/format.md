---
title: The .aurora format
description: The declarative JSON file every background is, field by field.
order: 2
---

# The .aurora format

A `.aurora` file is declarative JSON. It describes a background; it never contains shader code, so opening one can't run anything. Editors autocomplete it from the JSON Schema at [`/schema/v1.json`](https://aurora.goatsoft.io/schema/v1.json).

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Ember",
  "canvas": { "fade": "y" },
  "motion": { "speed": 1, "reduced": "still" },
  "palette": ["oklch(0.16 0.04 30)", "oklch(0.62 0.21 35)", "oklch(0.86 0.16 75)"],
  "layers": [
    { "type": "fire", "colors": [0, 1, 2] },
    { "type": "grain", "blend": "overlay", "opacity": 0.5 }
  ]
}
```

## The document

| Field | | |
|---|---|---|
| `format` | required | Always `"aurora"`. |
| `version` | required | The format version, `1`. Older files are migrated forward on load. |
| `name` | required | What Studio and error messages call it. |
| `palette` | required | Colours, in any CSS colour syntax Aurora understands; OKLCH is the native one. |
| `layers` | required | The stack, bottom first. |
| `canvas` | | Edge fade, fixed positioning and parallax. |
| `motion` | | Global speed and reduced-motion behaviour. |
| `fallback` | | `{ "mode": "auto" }` (the default) or hand-tuned CSS. |

## Layers

Each layer is one generator. Its `type` is the generator's id; its `params` are that generator's parameters, every one optional, with defaults chosen to look right untouched. See [Generators](../generators/README.md) for them all.

| Field | Default | |
|---|---|---|
| `type` | | The generator, such as `aurora-fbm` or `clouds`. |
| `colors` | `[0, 1, 2]` | Palette indices the generator uses, in its order. |
| `blend` | `normal` | `normal`, `screen`, `add`, `multiply` or `overlay`, onto the layers below. |
| `opacity` | `1` | The layer's opacity. |
| `mix` | `oklab` | Where colours blend: `oklab`, or `srgb` for exact parity with older sRGB shaders. |
| `mask` | | A `linear` (angle, start, end) or `radial` (x, y, start, end) fade. |

## Canvas and motion

`canvas.fade` fades the edges: `"y"` top and bottom, `"x"` left and right. `canvas.fixed` pins the background to the viewport, and `canvas.parallax` (0 to 1) moves it more slowly than the page.

`motion.speed` multiplies time, and 0 freezes the background. `motion.reduced` decides what happens under `prefers-reduced-motion`: `"still"` renders one frame, `"slow"` runs at a tenth of the speed, and `"css"` shows the CSS fallback.

## Validation

Files are checked against the schema and then against each generator: unknown types and parameters get "did you mean" suggestions, and colour indices must exist in the palette. With the bundler plugin this happens at build time, with errors at the file, line and column.
