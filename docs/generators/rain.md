# Rain (`rain`)

Air: falling rain in three depths, leaning with the wind.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Rain starter",
  "palette": [
    "oklch(0.86 0.03 240)"
  ],
  "layers": [
    {
      "type": "rain"
    }
  ]
}
```

This is [`presets/starters/rain.aurora`](/presets/starters/rain.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 1 palette colour, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Drops and haze | `oklch(0.86 0.03 240)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `amount` | Amount | 0.6 | 0 to 1 | Higher gives heavier rain, from a few drops to a downpour. |
| `speed` | Speed | 1 | 0 to 3 | How fast the drops fall. |
| `wind` | Wind | 0.2 | -1 to 1 | How far the rain leans, and which way. |
| `length` | Length | 0.5 | 0.1 to 1 | Higher gives longer streaks. |
| `haze` | Haze | 0.2 | 0 to 1 | A soft veil of rain, heavier near the ground. |
| `seed` | Seed | 0 | 0 to 100 | Different drops. |

## Implementation note

Built on the shared noise library: `hash`.
