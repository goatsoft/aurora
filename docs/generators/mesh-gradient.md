# Mesh gradient (`mesh-gradient`)

Four colours that drift and blend into each other.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Mesh gradient starter",
  "palette": [
    "oklch(0.6 0.2 262)",
    "oklch(0.52 0.25 300)",
    "oklch(0.74 0.15 198)",
    "oklch(0.62 0.23 350)"
  ],
  "layers": [
    {
      "type": "mesh-gradient"
    }
  ]
}
```

This is [`presets/starters/mesh-gradient.aurora`](/presets/starters/mesh-gradient.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 4 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | First drifting colour point | `oklch(0.6 0.2 262)` |
| 1 | Second colour point | `oklch(0.52 0.25 300)` |
| 2 | Third colour point | `oklch(0.74 0.15 198)` |
| 3 | Fourth colour point | `oklch(0.62 0.23 350)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `speed` | Speed | 0.12 | 0 to 1 | How fast the colour points drift. |
| `softness` | Softness | 2.4 | 1 to 6 | Higher keeps each colour in its own area; lower blends them broadly. |
| `warp` | Warp | 0.18 | 0 to 1 | Organic distortion of the blend. |
| `spread` | Spread | 0.36 | 0.05 to 0.6 | How far the colour points travel from the centre. |
| `seed` | Seed | 0 | 0 to 100 | Changes the paths. |

## Implementation note

Built on the shared noise library: `simplex`.
