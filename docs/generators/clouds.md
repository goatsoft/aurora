---
order: 8
---

# Clouds (`clouds`)

Air: cumulus clouds at two depths, lit from one side, drifting slowly.

```aurora
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

This is [`presets/starters/clouds.aurora`](/presets/starters/clouds.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Sky at the top | `oklch(0.58 0.13 248)` |
| 1 | Shaded side of the clouds | `oklch(0.7 0.05 255)` |
| 2 | Lit side of the clouds, and the sky near the horizon | `oklch(0.99 0.01 85)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `coverage` | Coverage | 0.42 | 0 to 1 | Higher fills more of the sky with cloud. |
| `softness` | Softness | 0.45 | 0.05 to 1 | Higher gives wispy, feathered edges; lower gives crisp, puffy ones. |
| `light` | Light | 0.7 | 0 to 1 | Higher gives stronger shading from the sun on one side. |
| `angle` | Angle | 90 deg | 0 to 360 | Direction the clouds drift, CSS convention (90 = left to right). |
| `speed` | Speed | 0.5 | 0 to 4 | How fast the clouds drift. |
| `scale` | Scale | 0.85 | 0.3 to 4 | Higher gives smaller, more numerous clouds; lower gives fewer, larger ones. |
| `sky` | Sky | 1 | 0 to 1 | Opacity of the sky behind the clouds; 0 for clouds alone. |
| `seed` | Seed | 0 | 0 to 100 | A different sky. |

## Implementation note

Built on the shared noise library: `fbm`, `worley`.
