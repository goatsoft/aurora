---
order: 3
---

# Starfield (`starfield`)

A night sky: twinkling stars, a faint milky way and the odd shooting star.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Starfield starter",
  "palette": [
    "oklch(0.12 0.03 268)",
    "oklch(0.26 0.07 288)",
    "oklch(0.97 0.02 245)"
  ],
  "layers": [
    {
      "type": "starfield"
    }
  ]
}
```

This is [`presets/starters/starfield.aurora`](/presets/starters/starfield.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Sky at the top | `oklch(0.12 0.03 268)` |
| 1 | Sky at the bottom, and the milky way | `oklch(0.26 0.07 288)` |
| 2 | Stars | `oklch(0.97 0.02 245)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `density` | Density | 0.65 | 0 to 1 | How many stars there are. |
| `brightness` | Brightness | 1 | 0 to 2 | How bright the stars shine. |
| `twinkle` | Twinkle | 0.5 | 0 to 1 | How much the stars shimmer. |
| `milkyway` | Milky way | 0.6 | 0 to 1 | Strength of the band of faint stars and glow. |
| `meteors` | Meteors | 0.35 | 0 to 1 | How often a shooting star crosses the sky. |
| `speed` | Speed | 0.5 | 0 to 4 | How fast the sky turns. |
| `sky` | Sky | 1 | 0 to 1 | Opacity of the sky behind the stars; 0 for stars alone. |
| `seed` | Seed | 0 | 0 to 100 | A different sky. |

## Implementation note

Built on the shared noise library: `fbm`, `hash`.
