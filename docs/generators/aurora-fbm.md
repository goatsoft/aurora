# Aurora (`aurora-fbm`)

Drifting ribbons of light.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Aurora starter",
  "palette": [
    "oklch(0.68 0.16 245)",
    "oklch(0.56 0.22 285)",
    "oklch(0.58 0.25 310)"
  ],
  "layers": [
    {
      "type": "aurora-fbm"
    }
  ]
}
```

This is [`presets/starters/aurora-fbm.aurora`](/presets/starters/aurora-fbm.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Ribbons, first colour | `oklch(0.68 0.16 245)` |
| 1 | Ribbons, second colour | `oklch(0.56 0.22 285)` |
| 2 | Ribbon highlights, and the right-hand end of `sweep` | `oklch(0.58 0.25 310)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `intensity` | Intensity | 1 | 0 to 2 | How strongly the ribbons show. Above 1 the brightest parts saturate. |
| `scale` | Scale | 1.6 | 0.1 to 5 | Higher gives smaller, busier ribbons; lower gives broader ones. |
| `speed` | Speed | 0.06 | 0 to 1 | How fast the field drifts. |
| `seed` | Seed | 0 | 0 to 100 | Offsets the field so neighbours look different. |
| `stretch` | Stretch | 0.55 | 0.05 to 3 | Lower gives longer, wispier ribbons; higher gives shorter ones. |
| `sweep` | Sweep | 0 | 0 to 1 | Blend toward a left-to-right gradient from the first to the last colour. |
