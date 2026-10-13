---
order: 14
---

# Strata (`strata`)

Earth: folded sandstone layers that drift slowly.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Strata starter",
  "palette": [
    "oklch(0.46 0.11 34)",
    "oklch(0.67 0.13 50)",
    "oklch(0.9 0.05 78)"
  ],
  "layers": [
    {
      "type": "strata"
    }
  ]
}
```

This is [`presets/starters/strata.aurora`](/presets/starters/strata.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Darkest layers | `oklch(0.46 0.11 34)` |
| 1 | Middle layers | `oklch(0.67 0.13 50)` |
| 2 | Lightest layers | `oklch(0.9 0.05 78)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `bands` | Bands | 9 | 2 to 30 | Number of sediment layers across the canvas. |
| `fold` | Fold | 0.32 | 0 to 2.5 | How much the layers bend and swirl. |
| `detail` | Detail | 0.35 | 0 to 1 | Fine bedding lines inside each layer. |
| `angle` | Angle | -12 deg | -90 to 90 | Tilt of the layers. |
| `speed` | Speed | 0.02 | 0 to 0.3 | Geological drift: how fast the layers flow. |
| `scale` | Scale | 1 | 0.3 to 4 | Higher gives smaller, tighter folds. |
| `seed` | Seed | 0 | 0 to 100 | A different rock face. |

## Implementation note

Built on the shared noise library: `fbm`, `hash`.
