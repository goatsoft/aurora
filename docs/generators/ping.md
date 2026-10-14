---
order: 24
---

# Ping (`ping`)

Tech: luminous pulses expanding from a point and dissolving into a soft halo.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Ping starter",
  "palette": [
    "oklch(0.14 0.04 265)",
    "oklch(0.73 0.13 210)",
    "oklch(0.88 0.09 185)"
  ],
  "layers": [
    {
      "type": "ping"
    }
  ]
}
```

This is [`presets/starters/ping.aurora`](/presets/starters/ping.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Dark field | `oklch(0.14 0.04 265)` |
| 1 | Pulse halo | `oklch(0.73 0.13 210)` |
| 2 | Pulse cores | `oklch(0.88 0.09 185)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `speed` | Speed | 0.12 | 0 to 0.6 | Outward pulse speed; 0 keeps the rings still. |
| `spacing` | Spacing | 0.24 | 0.08 to 0.6 | Distance between pulses, relative to the shorter canvas side. |
| `width` | Width | 1.5 px | 0.5 to 6 | Pulse line width in canvas pixels. |
| `decay` | Decay | 2.5 | 0.5 to 8 | How quickly pulses fade as they move outwards. |
| `glow` | Glow | 0.4 | 0 to 1 | Soft light surrounding each pulse. |
| `x` | Origin X | 0.5 | 0 to 1 | Horizontal pulse origin; 0 is left and 1 is right. |
| `y` | Origin Y | 0.5 | 0 to 1 | Vertical pulse origin; 0 is top and 1 is bottom. |
