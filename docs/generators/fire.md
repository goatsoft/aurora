# Fire (`fire`)

Fire: flames licking up from the bottom edge, with rising embers.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Fire starter",
  "palette": [
    "oklch(0.42 0.18 27)",
    "oklch(0.66 0.22 42)",
    "oklch(0.92 0.15 88)"
  ],
  "layers": [
    {
      "type": "fire"
    }
  ]
}
```

The starter above is [`presets/starters/fire.aurora`](/presets/starters/fire.aurora). It reads 3 palette colours, in order. Uses the noise library: `fbm`, `worley`, `hash`.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `height` | Height | 0.6 | 0.1 to 1.2 | How far up the canvas the flames reach. |
| `speed` | Speed | 0.55 | 0 to 3 | How fast the flames rise. |
| `turbulence` | Turbulence | 0.65 | 0 to 1.5 | How wildly the flames lick. |
| `scale` | Scale | 2.2 | 0.5 to 6 | Size of the flame tongues. |
| `embers` | Embers | 0.5 | 0 to 1 | How many sparks rise above the flames. |
| `seed` | Seed | 0 | 0 to 100 | A different fire. |

## Default palette

- `oklch(0.42 0.18 27)`
- `oklch(0.66 0.22 42)`
- `oklch(0.92 0.15 88)`
