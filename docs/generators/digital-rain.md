---
order: 18
---

# Digital rain (`digital-rain`)

Tech: luminous glyphs falling in uneven columns, with bright heads and fading trails.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Digital rain starter",
  "palette": [
    "oklch(0.12 0.025 165)",
    "oklch(0.7 0.17 155)",
    "oklch(0.95 0.055 155)"
  ],
  "layers": [
    {
      "type": "digital-rain"
    }
  ]
}
```

This is [`presets/starters/digital-rain.aurora`](/presets/starters/digital-rain.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Dark field | `oklch(0.12 0.025 165)` |
| 1 | Glyph trails | `oklch(0.7 0.17 155)` |
| 2 | Bright leading glyphs | `oklch(0.95 0.055 155)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `density` | Density | 20 | 8 to 64 | Glyphs per canvas height; columns follow the aspect ratio. |
| `speed` | Speed | 0.22 | 0 to 2 | How quickly the heads fall. |
| `trail` | Trail | 0.45 | 0.1 to 0.9 | Length of each fading trail. |
| `rate` | Change rate | 2 /s | 0 to 12 | Glyph changes per second; 0 keeps the symbols fixed. |
| `glow` | Glow | 0.25 | 0 to 1 | Soft light surrounding each column. |
| `seed` | Seed | 0 | 0 to 100 | Different glyphs and column timings. |

## Implementation note

Built on the shared noise library: `hash`.
