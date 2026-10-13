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
    "oklch(0.8 0.16 80)",
    "oklch(1 0 0)"
  ],
  "layers": [
    {
      "type": "conic"
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

The starter above is [`presets/starters/conic.aurora`](/presets/starters/conic.aurora). It reads 3 palette colours, in order.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `speed` | Speed | 0.015 turn/s | -0.5 to 0.5 | Turns per second. |
| `twist` | Twist | 0.35 | -4 to 4 | Spirals the colours outwards. |
| `x` | Centre x | 0.5 | 0 to 1 | Centre, as a fraction of the width. |
| `y` | Centre y | 0.5 | 0 to 1 | Centre, as a fraction of the height. |
| `halo` | Halo | 0 | 0 to 1 | Fades the edges out, leaving a glow around the centre. |

## Default palette

- `oklch(0.72 0.17 205)`
- `oklch(0.62 0.25 300)`
- `oklch(0.8 0.16 80)`
