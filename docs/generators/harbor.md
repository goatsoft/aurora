---
order: 19
---

# Harbor (`harbor`)

City: shoreline water below the horizon, with shimmering vertical light reflections and embankment lights.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Harbor starter",
  "palette": [
    "oklch(0.08 0.025 250)",
    "oklch(0.24 0.065 235)",
    "oklch(0.88 0.12 80)"
  ],
  "layers": [
    {
      "type": "harbor"
    }
  ]
}
```

This is [`presets/starters/harbor.aurora`](/presets/starters/harbor.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Deep water in the foreground | `oklch(0.08 0.025 250)` |
| 1 | Reflected sky and horizon water | `oklch(0.24 0.065 235)` |
| 2 | Shimmering light columns and shoreline lamps | `oklch(0.88 0.12 80)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `horizon` | Waterline | 0.28 | 0.08 to 0.65 | Height of the water from the bottom of the canvas. |
| `reflections` | Reflections | 0.8 | 0 to 1 | Brightness of the vertical light columns reflected across the water. |
| `columns` | Columns | 10 | 3 to 24 | How many skyline light columns reflect across the harbor. |
| `ripples` | Ripples | 1 | 0.2 to 3 | Higher gives finer horizontal ripples; lower gives broad swells. |
| `chop` | Chop | 0.45 | 0 to 1 | How much the waves break and widen the reflected columns. |
| `shoreline` | Shoreline | 0.65 | 0 to 1 | Brightness of the pier and embankment lights along the water's edge. |
| `speed` | Speed | 0.4 | 0 to 2 | How fast the water ripples. |
| `seed` | Seed | 0 | 0 to 100 | A different pattern of reflections. |

## Implementation note

Built on the shared noise library: `simplex`, `hash`.
