---
order: 2
---

# Curtain (`curtain`)

Aurora curtains: a bright, swaying lower edge with rays rising out of it.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Curtain starter",
  "palette": [
    "oklch(0.88 0.23 150)",
    "oklch(0.74 0.18 170)",
    "oklch(0.62 0.22 340)"
  ],
  "layers": [
    {
      "type": "curtain"
    }
  ]
}
```

This is [`presets/starters/curtain.aurora`](/presets/starters/curtain.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Lower edge | `oklch(0.88 0.23 150)` |
| 1 | Middle of the curtain | `oklch(0.74 0.18 170)` |
| 2 | Upper fringe | `oklch(0.62 0.22 340)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `intensity` | Intensity | 1 | 0 to 2 | How bright the curtains glow. |
| `base` | Edge | 0.62 | 0.1 to 1 | Where the lower edge hangs, from the top of the canvas. |
| `height` | Height | 0.5 | 0.1 to 1 | How far the light rises above the edge. |
| `wave` | Wave | 0.5 | 0 to 1 | How much the edge folds and sways. |
| `rays` | Rays | 0.6 | 0 to 1 | How strongly the light breaks into vertical rays. |
| `rise` | Rise | 0.2 | 0 to 1 | How fast the rays climb. |
| `speed` | Sway | 0.12 | 0 to 1 | How fast the edge moves. |
| `folds` | Folds | 2 | 1 to 3 | Curtains one behind another. |
| `tilt` | Tilt | 0 | -0.6 to 0.6 | Raises the edge towards one side, so the curtain sweeps across the sky. |
| `arc` | Arc | 0 | -1 to 1 | Bends the edge: positive curves both ends up, negative bows the middle up. |
| `cover` | Cover | 0 | 0 to 1 | Fills the gaps along the curtain, from separate patches to one band across the sky. |
| `glow` | Glow | 0.3 | 0 to 1 | Soft light between the rays. |
| `seed` | Seed | 0 | 0 to 100 | A different sky. |

## Implementation note

Built on the shared noise library: `fbm`, `value`.
