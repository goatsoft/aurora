---
order: 5
---

# Linear sweep (`linear-sweep`)

A flowing linear gradient through three colours.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Linear sweep starter",
  "palette": [
    "oklch(0.55 0.2 275)",
    "oklch(0.68 0.22 330)",
    "oklch(0.82 0.15 65)"
  ],
  "layers": [
    {
      "type": "linear-sweep"
    }
  ]
}
```

This is [`presets/starters/linear-sweep.aurora`](/presets/starters/linear-sweep.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | First colour along the sweep | `oklch(0.55 0.2 275)` |
| 1 | Middle colour | `oklch(0.68 0.22 330)` |
| 2 | Last colour | `oklch(0.82 0.15 65)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `angle` | Angle | 135 deg | 0 to 360 | Direction of the gradient, CSS convention. |
| `spin` | Spin | 0 deg/s | -90 to 90 | Turns the gradient over time. |
| `speed` | Speed | 0.05 | 0 to 1 | How fast the colours flow along the gradient. |
| `scale` | Scale | 1 | 0.25 to 4 | How many times the colours repeat across the canvas; higher repeats more. |
