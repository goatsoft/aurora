# Treeline (`treeline`)

Earth: rows of spruce silhouettes along the horizon, with glow behind them.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Treeline starter",
  "palette": [
    "oklch(0.06 0.01 250)",
    "oklch(0.13 0.03 245)",
    "oklch(0.45 0.1 165)"
  ],
  "layers": [
    {
      "type": "treeline"
    }
  ]
}
```

This is [`presets/starters/treeline.aurora`](/presets/starters/treeline.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Nearest trees and the ground | `oklch(0.06 0.01 250)` |
| 1 | Farthest trees | `oklch(0.13 0.03 245)` |
| 2 | Glow along the horizon | `oklch(0.45 0.1 165)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `height` | Height | 0.24 | 0.05 to 0.6 | How tall the nearest trees stand, as a fraction of the canvas. |
| `density` | Density | 10 | 2 to 40 | Trees across one canvas height. |
| `rows` | Rows | 2 | 1 to 3 | Rows of trees, one behind another. |
| `variation` | Variation | 0.6 | 0 to 1 | How much the trees differ in height. |
| `mist` | Glow | 0.3 | 0 to 1 | Light along the horizon behind the trees. |
| `speed` | Drift | 0 | 0 to 2 | How fast the rows slide past (near ones faster). |
| `seed` | Seed | 0 | 0 to 100 | A different forest. |

## Implementation note

Built on the shared noise library: `fbm`, `hash`.
