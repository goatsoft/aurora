---
order: 6
---

# Conic (`conic`)

Colours turning around a point.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Conic starter",
  "palette": [
    "oklch(0.72 0.17 205)",
    "oklch(0.62 0.25 300)",
    "oklch(0.8 0.16 80)"
  ],
  "layers": [
    {
      "type": "conic"
    }
  ]
}
```

This is [`presets/starters/conic.aurora`](/presets/starters/conic.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | First colour around the centre | `oklch(0.72 0.17 205)` |
| 1 | Second colour | `oklch(0.62 0.25 300)` |
| 2 | Third colour | `oklch(0.8 0.16 80)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `speed` | Speed | 0.015 turn/s | -0.5 to 0.5 | Turns per second. |
| `twist` | Twist | 0.35 | -4 to 4 | Spirals the colours outwards. |
| `x` | Centre x | 0.5 | 0 to 1 | Centre, as a fraction of the width. |
| `y` | Centre y | 0.5 | 0 to 1 | Centre, as a fraction of the height. |
| `halo` | Halo | 0 | 0 to 1 | Fades the edges out, leaving a glow around the centre. |
