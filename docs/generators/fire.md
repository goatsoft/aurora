---
order: 16
---

# Fire (`fire`)

Fire: flames rising from the bottom edge, with embers above them.

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

This is [`presets/starters/fire.aurora`](/presets/starters/fire.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Base of the flames | `oklch(0.42 0.18 27)` |
| 1 | Middle of the flames | `oklch(0.66 0.22 42)` |
| 2 | Flame tips and embers | `oklch(0.92 0.15 88)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `height` | Height | 0.6 | 0.1 to 1.2 | How far up the canvas the flames reach. |
| `speed` | Speed | 0.55 | 0 to 3 | How fast the flames rise. |
| `turbulence` | Turbulence | 0.65 | 0 to 1.5 | Higher makes the flames lick and flicker more. |
| `scale` | Scale | 2.2 | 0.5 to 6 | Higher gives smaller, more numerous flame tongues. |
| `embers` | Embers | 0.5 | 0 to 1 | How many sparks rise above the flames. |
| `seed` | Seed | 0 | 0 to 100 | A different fire. |

## Implementation note

Built on the shared noise library: `fbm`, `worley`, `hash`.
