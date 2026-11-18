---
order: 18
---

# City lights (`city-lights`)

City: a sprawling grid of street lights, glowing boulevards and soft foreground bokeh below the horizon.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "City lights starter",
  "palette": [
    "oklch(0.07 0.02 255)",
    "oklch(0.86 0.14 75)",
    "oklch(0.88 0.11 215)"
  ],
  "layers": [
    {
      "type": "city-lights"
    }
  ]
}
```

This is [`presets/starters/city-lights.aurora`](/presets/starters/city-lights.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Dark urban ground | `oklch(0.07 0.02 255)` |
| 1 | Warm street and boulevard lights | `oklch(0.86 0.14 75)` |
| 2 | Cool accent lights and bright intersections | `oklch(0.88 0.11 215)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `horizon` | Horizon | 0.32 | 0.1 to 0.75 | Height of the urban sprawl from the bottom of the canvas. |
| `density` | Density | 0.7 | 0.1 to 1 | How much of the basin is filled with street and building lights. |
| `streets` | Boulevards | 0.6 | 0 to 1 | Brightness of the arterial roads and moving traffic streams. |
| `bokeh` | Bokeh | 0.45 | 0 to 1 | Soft out-of-focus light halos in the foreground. |
| `twinkle` | Shimmer | 0.45 | 0 to 1 | Heat-haze shimmer across distant lights. |
| `speed` | Speed | 0.25 | 0 to 2 | How fast traffic flows and distant lights shimmer. |
| `seed` | Seed | 0 | 0 to 100 | A different street grid. |

## Implementation note

Built on the shared noise library: `fbm`, `hash`.
