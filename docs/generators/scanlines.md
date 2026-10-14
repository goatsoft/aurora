---
order: 22
---

# Scan lines (`scanlines`)

Tech: a luminous CRT raster with soft scan lines and a slow rolling exposure band.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Scan lines starter",
  "palette": [
    "oklch(0.12 0.03 285)",
    "oklch(0.48 0.1 230)",
    "oklch(0.8 0.12 195)"
  ],
  "layers": [
    {
      "type": "scanlines"
    }
  ]
}
```

This is [`presets/starters/scanlines.aurora`](/presets/starters/scanlines.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Dark field | `oklch(0.12 0.03 285)` |
| 1 | Raster lines | `oklch(0.48 0.1 230)` |
| 2 | Rolling exposure highlights | `oklch(0.8 0.12 195)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `spacing` | Spacing | 6 px | 2 to 24 | Distance between scan lines in canvas pixels. |
| `softness` | Softness | 0.4 | 0 to 1 | Softness of the raster lines. |
| `strength` | Strength | 0.4 | 0 to 1 | Brightness of the raster lines. |
| `speed` | Drift | 0.045 | 0 to 0.2 | Speed of the travelling exposure band; 0 keeps it still. |
| `roll` | Roll | 0.5 | 0 to 1 | Brightness of the broad exposure band. |
| `phase` | Phase | 0.2 | 0 to 1 | Starting position of the exposure band. |
