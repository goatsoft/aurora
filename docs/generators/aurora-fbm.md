# Aurora (`aurora-fbm`)

Drifting aurora ribbons from domain-warped fractal noise.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Aurora starter",
  "palette": [
    "oklch(0.68 0.16 245)",
    "oklch(0.56 0.22 285)",
    "oklch(0.58 0.25 310)"
  ],
  "layers": [
    {
      "type": "aurora-fbm"
    }
  ]
}
```

The starter above is [`presets/starters/aurora-fbm.aurora`](/presets/starters/aurora-fbm.aurora). It reads 3 palette colours, in order.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `intensity` | Intensity | 1 | 0 to 2 | Overall opacity of the ribbons. Above 1 overdrives the glow. |
| `scale` | Scale | 1.6 | 0.1 to 5 | Noise zoom: smaller gives broader ribbons. |
| `speed` | Speed | 0.06 | 0 to 1 | How fast the field drifts. |
| `seed` | Seed | 0 | 0 to 100 | Offsets the field so neighbours look different. |
| `stretch` | Stretch | 0.55 | 0.05 to 3 | Horizontal stretch: smaller gives longer, wispier ribbons. |
| `sweep` | Sweep | 0 | 0 to 1 | Blend toward a left-to-right gradient from the first to the last colour. |

## Default palette

- `oklch(0.68 0.16 245)`
- `oklch(0.56 0.22 285)`
- `oklch(0.58 0.25 310)`
