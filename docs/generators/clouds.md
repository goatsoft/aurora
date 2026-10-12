# Clouds (`clouds`)

Air: soft, sunlit clouds drifting across an open sky.

![Clouds with its defaults](/packages/core/test/golden/clouds.png)

Reads 3 palette colours, in order. Uses the noise library: `fbm`.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `coverage` | Coverage | 0.42 | 0 to 1 | How much of the sky the clouds fill. |
| `softness` | Softness | 0.45 | 0.05 to 1 | Wispy, feathered edges or crisp, puffy ones. |
| `light` | Light | 0.7 | 0 to 1 | How strongly the sun shades the clouds. |
| `angle` | Angle | 90 deg | 0 to 360 | Direction the clouds drift, CSS convention (90 = left to right). |
| `speed` | Speed | 0.5 | 0 to 4 | How fast the clouds drift. |
| `scale` | Scale | 0.85 | 0.3 to 4 | Size of the clouds. |
| `sky` | Sky | 1 | 0 to 1 | Opacity of the sky behind the clouds; 0 for clouds alone. |
| `seed` | Seed | 0 | 0 to 100 | A different sky. |

## Default palette

- `oklch(0.58 0.13 248)`
- `oklch(0.7 0.05 255)`
- `oklch(0.99 0.01 85)`

## Starter

[`presets/starters/clouds.aurora`](/presets/starters/clouds.aurora)

```json
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Clouds starter",
  "palette": [
    "oklch(0.58 0.13 248)",
    "oklch(0.7 0.05 255)",
    "oklch(0.99 0.01 85)"
  ],
  "layers": [
    {
      "type": "clouds"
    }
  ]
}
```
