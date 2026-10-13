# Linear gradient (`linear-gradient`)

A straight gradient through two to four colours, like CSS linear-gradient().

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Linear gradient starter",
  "palette": [
    "oklch(0.16 0.05 275)",
    "oklch(0.32 0.11 295)",
    "oklch(0.55 0.16 330)",
    "oklch(0.78 0.13 60)"
  ],
  "layers": [
    {
      "type": "linear-gradient"
    }
  ]
}
```

This is [`presets/starters/linear-gradient.aurora`](/presets/starters/linear-gradient.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 4 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Start of the gradient | `oklch(0.16 0.05 275)` |
| 1 | Second stop | `oklch(0.32 0.11 295)` |
| 2 | Third stop (with three or more stops) | `oklch(0.55 0.16 330)` |
| 3 | Fourth stop (with four stops) | `oklch(0.78 0.13 60)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `angle` | Angle | 180 deg | 0 to 360 | Direction, as in CSS: 0 points up, 90 right, 180 down. |
| `stops` | Stops | 3 | 2 to 4 | How many palette colours the gradient runs through, in order. |
| `stop2` | Stop 2 | 0.5 | 0 to 1 | Where the second colour sits along the gradient. |
| `stop3` | Stop 3 | 0.75 | 0 to 1 | Where the third colour sits, with four stops. |
| `drift` | Drift | 0 deg/s | -30 to 30 | Turns the gradient slowly; 0 keeps it still. |
