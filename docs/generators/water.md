# Water (`water`)

Water: sunlight caustics rippling over deep, clear water.

![Water with its defaults](/packages/core/test/golden/water.png)

Reads 3 palette colours, in order. Uses the noise library: `worley`, `simplex`.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `scale` | Scale | 3 | 0.5 to 10 | Size of the caustic cells. |
| `speed` | Speed | 0.28 | 0 to 2 | How fast the light ripples. |
| `caustics` | Caustics | 0.85 | 0 to 2 | Brightness of the light web. |
| `sharpness` | Sharpness | 0.6 | 0 to 1 | Thin, crisp lines or broad, soft light. |
| `wobble` | Wobble | 0.35 | 0 to 1 | How much the surface distorts the light. |
| `depth` | Depth | 0.6 | 0 to 1 | How much darker the water gets towards the bottom. |
| `seed` | Seed | 0 | 0 to 100 | A different surface. |

## Default palette

- `oklch(0.3 0.08 245)`
- `oklch(0.55 0.12 220)`
- `oklch(0.95 0.07 185)`

## Starter

[`presets/starters/water.aurora`](/presets/starters/water.aurora)

```json
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Water starter",
  "palette": [
    "oklch(0.3 0.08 245)",
    "oklch(0.55 0.12 220)",
    "oklch(0.95 0.07 185)"
  ],
  "layers": [
    {
      "type": "water"
    }
  ]
}
```
