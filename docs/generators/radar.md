---
order: 21
---

# Radar (`radar`)

Tech: a rotating radar sweep, range rings and contacts fading into the dark.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Radar starter",
  "palette": [
    "oklch(0.12 0.025 170)",
    "oklch(0.76 0.15 165)",
    "oklch(0.92 0.08 150)"
  ],
  "layers": [
    {
      "type": "radar"
    }
  ]
}
```

This is [`presets/starters/radar.aurora`](/presets/starters/radar.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Dark field | `oklch(0.12 0.025 170)` |
| 1 | Sweep and range rings | `oklch(0.76 0.15 165)` |
| 2 | Contact highlights | `oklch(0.92 0.08 150)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `speed` | Speed | 0.08 /s | 0 to 0.5 | Clockwise rotations per second; 0 keeps the sweep still. |
| `scale` | Scale | 0.85 | 0.3 to 1.5 | Diameter relative to the shorter canvas side. |
| `rings` | Range rings | 5 | 1 to 12 | Number of evenly spaced range rings. |
| `contacts` | Contacts | 16 | 0 to 24 | Number of illuminated returns. |
| `persistence` | Persistence | 0.6 | 0.05 to 1 | How long the sweep and contacts remain lit. |
| `grid` | Grid | 0.45 | 0 to 1 | Brightness of range rings and crosshairs. |
| `seed` | Seed | 0 | 0 to 100 | Different contact positions. |

## Implementation note

Built on the shared noise library: `hash`.
