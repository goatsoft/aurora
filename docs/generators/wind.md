---
order: 9
---

# Wind (`wind`)

Air in motion: thin streaks that flow across the canvas and bend in gusts.

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

This is [`presets/starters/wind.aurora`](/presets/starters/wind.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Faint parts of the streaks | `oklch(0.86 0.05 225)` |
| 1 | The CSS fallback's wash (the WebGPU version doesn't use it) | `oklch(0.68 0.1 240)` |
| 2 | Bright cores of the streaks | `oklch(0.97 0.02 210)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `angle` | Angle | 75 deg | 0 to 360 | Direction the wind blows, CSS convention (90 = left to right). |
| `speed` | Speed | 0.22 | 0 to 2 | How fast the streaks travel. |
| `stretch` | Stretch | 6 | 1 to 20 | Higher gives longer streaks. |
| `gust` | Gust | 0.55 | 0 to 2 | How much the flow bends. |
| `density` | Density | 0.45 | 0 to 1 | How much of the sky the streaks fill. |
| `scale` | Scale | 2.5 | 0.5 to 8 | Higher gives smaller, finer streaks. |
| `seed` | Seed | 0 | 0 to 100 | A different sky. |

## Implementation note

Built on the shared noise library: `curl`, `simplex`.
