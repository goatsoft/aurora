---
order: 17
---

# Grain (`grain`)

Animated film grain, to lay over other layers.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Grain starter",
  "palette": [
    "oklch(1 0 0)"
  ],
  "layers": [
    {
      "type": "grain"
    }
  ]
}
```

This is [`presets/starters/grain.aurora`](/presets/starters/grain.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 1 palette colour, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Grain | `oklch(1 0 0)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `amount` | Amount | 0.07 | 0 to 0.5 | Grain strength. |
| `size` | Size | 1 px | 1 to 6 | Grain size in whole canvas pixels. |
| `rate` | Rate | 18 /s | 0 to 30 | New grain patterns per second; 0 keeps it still. |

## Implementation note

Built on the shared noise library: `hash`.
