---
order: 15
---

# Water (`water`)

Water: moving light patterns on the floor of clear water.

```aurora
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

This is [`presets/starters/water.aurora`](/presets/starters/water.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Deep water, towards the bottom | `oklch(0.3 0.08 245)` |
| 1 | Shallow water, towards the top | `oklch(0.55 0.12 220)` |
| 2 | Light patterns | `oklch(0.95 0.07 185)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `scale` | Scale | 3 | 0.5 to 10 | Higher gives smaller light cells; lower gives larger ones. |
| `speed` | Speed | 0.28 | 0 to 2 | How fast the light ripples. |
| `caustics` | Caustics | 0.85 | 0 to 2 | Brightness of the light web. |
| `sharpness` | Sharpness | 0.6 | 0 to 1 | Higher gives thin, crisp lines; lower gives broad, soft light. |
| `wobble` | Wobble | 0.35 | 0 to 1 | How much the surface distorts the light. |
| `depth` | Depth | 0.6 | 0 to 1 | How much darker the water gets towards the bottom. |
| `seed` | Seed | 0 | 0 to 100 | A different surface. |

## Implementation note

Built on the shared noise library: `worley`, `simplex`.
