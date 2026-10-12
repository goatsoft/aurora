# Wind (`wind`)

Air in motion: silky streaks flowing across the canvas, bent by gusts.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Wind starter",
  "palette": [
    "oklch(0.86 0.05 225)",
    "oklch(0.68 0.1 240)",
    "oklch(0.97 0.02 210)"
  ],
  "layers": [
    {
      "type": "wind"
    }
  ]
}
```

The starter above is [`presets/starters/wind.aurora`](/presets/starters/wind.aurora). It reads 3 palette colours, in order. Uses the noise library: `curl`, `simplex`.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `angle` | Angle | 75 deg | 0 to 360 | Direction the wind blows, CSS convention (90 = left to right). |
| `speed` | Speed | 0.22 | 0 to 2 | How fast the streaks travel. |
| `stretch` | Stretch | 6 | 1 to 20 | How long the streaks are. |
| `gust` | Gust | 0.55 | 0 to 2 | How much the flow bends. |
| `density` | Density | 0.45 | 0 to 1 | How much of the sky the streaks fill. |
| `scale` | Scale | 2.5 | 0.5 to 8 | Size of the streaks. |
| `seed` | Seed | 0 | 0 to 100 | A different sky. |

## Default palette

- `oklch(0.86 0.05 225)`
- `oklch(0.68 0.1 240)`
- `oklch(0.97 0.02 210)`
