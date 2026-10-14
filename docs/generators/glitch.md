---
order: 19
---

# Glitch (`glitch`)

Tech: fractured signal bands and separated colour accents, punctuated by short bursts.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Glitch starter",
  "palette": [
    "oklch(0.13 0.035 285)",
    "oklch(0.75 0.14 195)",
    "oklch(0.65 0.23 340)"
  ],
  "layers": [
    {
      "type": "glitch"
    }
  ]
}
```

This is [`presets/starters/glitch.aurora`](/presets/starters/glitch.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Dark field | `oklch(0.13 0.035 285)` |
| 1 | First signal accent | `oklch(0.75 0.14 195)` |
| 2 | Second signal accent | `oklch(0.65 0.23 340)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `frequency` | Frequency | 0.5 /s | 0 to 2 | Burst windows per second; 0 freezes the signal. |
| `strength` | Strength | 0.45 | 0 to 1 | Horizontal displacement during a burst. |
| `bands` | Bands | 32 | 8 to 80 | Number of horizontal signal bands. |
| `density` | Density | 0.3 | 0 to 1 | How much of the signal carries illuminated blocks. |
| `separation` | Separation | 0.4 | 0 to 1 | Distance between the two colour accents. |
| `seed` | Seed | 0 | 0 to 100 | Different signal fragments. |

## Implementation note

Built on the shared noise library: `hash`.
