---
order: 20
---

# Static (`static`)

Tech: electronic noise, rolling interference bands and pockets of signal dropout.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Static starter",
  "palette": [
    "oklch(0.13 0.025 265)",
    "oklch(0.4 0.08 230)",
    "oklch(0.8 0.12 195)"
  ],
  "layers": [
    {
      "type": "static"
    }
  ]
}
```

This is [`presets/starters/static.aurora`](/presets/starters/static.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Dark field | `oklch(0.13 0.025 265)` |
| 1 | Signal noise | `oklch(0.4 0.08 230)` |
| 2 | Interference highlights | `oklch(0.8 0.12 195)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `size` | Cell size | 2 px | 1 to 8 | Noise cell size in whole canvas pixels. |
| `rate` | Rate | 8 /s | 0 to 30 | Signal updates per second; 0 freezes the noise and interference. |
| `contrast` | Contrast | 0.35 | 0 to 1 | Brightness and contrast of the signal noise. |
| `interference` | Interference | 0.35 | 0 to 1 | Strength of the rolling horizontal signal bands. |
| `dropout` | Dropout | 0.25 | 0 to 1 | Amount of dark horizontal signal loss. |
| `seed` | Seed | 0 | 0 to 100 | Different signal noise. |

## Implementation note

Built on the shared noise library: `hash`.
