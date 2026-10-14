---
order: 23
---

# Phosphor (`phosphor`)

Tech: a glowing display-dot lattice with a soft, drifting phosphor bloom.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Phosphor starter",
  "palette": [
    "oklch(0.13 0.035 285)",
    "oklch(0.65 0.15 200)",
    "oklch(0.65 0.2 335)"
  ],
  "layers": [
    {
      "type": "phosphor"
    }
  ]
}
```

This is [`presets/starters/phosphor.aurora`](/presets/starters/phosphor.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Dark field | `oklch(0.13 0.035 285)` |
| 1 | First phosphor tint | `oklch(0.65 0.15 200)` |
| 2 | Second phosphor tint | `oklch(0.65 0.2 335)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `spacing` | Spacing | 8 px | 2 to 24 | Distance between phosphor dots in canvas pixels. |
| `glow` | Glow | 0.45 | 0 to 1 | Soft light around each display dot. |
| `strength` | Strength | 0.4 | 0 to 1 | Brightness of the phosphor texture. |
| `speed` | Speed | 0.08 | 0 to 0.3 | Drift of the broad illumination; 0 keeps it still. |
| `phase` | Phase | 0 | 0 to 1 | Starting position of the illumination. |
