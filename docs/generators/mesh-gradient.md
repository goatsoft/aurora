# Mesh gradient (`mesh-gradient`)

Four soft colour fields drifting into each other.

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
    "oklch(0.62 0.23 350)",
    "oklch(1 0 0)"
  ],
  "layers": [
    {
      "type": "mesh-gradient"
    },
    {
      "type": "grain",
      "blend": "overlay",
      "colors": [
        4
      ],
      "params": {
        "amount": 0.06
      }
    }
  ]
}
```

The starter above is [`presets/starters/mesh-gradient.aurora`](/presets/starters/mesh-gradient.aurora). It reads 4 palette colours, in order. Uses the noise library: `simplex`.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `speed` | Speed | 0.12 | 0 to 1 | How fast the colour points drift. |
| `softness` | Softness | 2.4 | 1 to 6 | Higher keeps each colour in its own area; lower blends them broadly. |
| `warp` | Warp | 0.18 | 0 to 1 | Organic distortion of the blend. |
| `spread` | Spread | 0.36 | 0.05 to 0.6 | How far the colour points travel from the centre. |
| `seed` | Seed | 0 | 0 to 100 | Changes the paths. |

## Default palette

- `oklch(0.6 0.2 262)`
- `oklch(0.52 0.25 300)`
- `oklch(0.74 0.15 198)`
- `oklch(0.62 0.23 350)`
