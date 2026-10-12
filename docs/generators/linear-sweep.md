# Linear sweep (`linear-sweep`)

A flowing linear gradient through three colours.

![Linear sweep with its defaults](/packages/core/test/golden/linear-sweep.png)

Reads 3 palette colours, in order.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `angle` | Angle | 135 deg | 0 to 360 | Direction of the gradient, CSS convention. |
| `spin` | Spin | 0 deg/s | -90 to 90 | Turns the gradient over time. |
| `speed` | Speed | 0.05 | 0 to 1 | How fast the colours flow along the gradient. |
| `scale` | Scale | 1 | 0.25 to 4 | Colour cycles across the canvas. |

## Default palette

- `oklch(0.55 0.2 275)`
- `oklch(0.68 0.22 330)`
- `oklch(0.82 0.15 65)`

## Starter

[`presets/starters/linear-sweep.aurora`](/presets/starters/linear-sweep.aurora)

```json
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Linear sweep starter",
  "palette": [
    "oklch(0.55 0.2 275)",
    "oklch(0.68 0.22 330)",
    "oklch(0.82 0.15 65)",
    "oklch(1 0 0)"
  ],
  "layers": [
    {
      "type": "linear-sweep"
    },
    {
      "type": "grain",
      "blend": "overlay",
      "colors": [
        3
      ],
      "params": {
        "amount": 0.06
      }
    }
  ]
}
```
