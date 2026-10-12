# Strata (`strata`)

Earth: flowing sandstone layers, folded and carved by wind.

![Strata with its defaults](/packages/core/test/golden/strata.png)

Reads 3 palette colours, in order. Uses the noise library: `fbm`, `hash`.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `bands` | Bands | 9 | 2 to 30 | Number of sediment layers across the canvas. |
| `fold` | Fold | 0.32 | 0 to 2.5 | How much the layers bend and swirl. |
| `detail` | Detail | 0.35 | 0 to 1 | Fine bedding lines inside each layer. |
| `angle` | Angle | -12 deg | -90 to 90 | Tilt of the layers. |
| `speed` | Speed | 0.02 | 0 to 0.3 | Geological drift: how fast the layers flow. |
| `scale` | Scale | 1 | 0.3 to 4 | Size of the folds. |
| `seed` | Seed | 0 | 0 to 100 | A different rock face. |

## Default palette

- `oklch(0.46 0.11 34)`
- `oklch(0.67 0.13 50)`
- `oklch(0.9 0.05 78)`

## Starter

[`presets/starters/strata.aurora`](/presets/starters/strata.aurora)

```json
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
