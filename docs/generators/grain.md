# Grain (`grain`)

Fine animated film grain that takes the digital edge off gradients.

![Grain with its defaults](/packages/core/test/golden/grain.png)

Reads 1 palette colour, in order. Uses the noise library: `hash`.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `amount` | Amount | 0.07 | 0 to 0.5 | Grain strength. |
| `size` | Size | 1.5 px | 0.5 to 6 | Grain size in canvas pixels. |
| `rate` | Rate | 18 /s | 0 to 30 | New grain patterns per second; 0 keeps it still. |

## Default palette

- `oklch(1 0 0)`

## Starter

[`presets/starters/grain.aurora`](/presets/starters/grain.aurora)

```json
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Grain starter",
  "palette": [
    "oklch(1 0 0)"
  ],
  "layers": [
    {
      "type": "grain"
    }
  ]
}
```
