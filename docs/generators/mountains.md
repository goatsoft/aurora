# Mountains (`mountains`)

Earth: a few peaks on layered ridges, fading into haze, with valley mist and lit crests.

![Mountains with its defaults](/packages/core/test/golden/mountains.png)

Reads 3 palette colours, in order. Uses the noise library: `fbm`, `hash`.

## Parameters

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `ridges` | Ridges | 3 | 1 to 6 | How many layers of mountains. |
| `peaks` | Peaks | 1.6 | 1 to 8 | How many peaks stand across the nearest ridge; farther ridges have a few more. |
| `height` | Height | 0.55 | 0.1 to 0.95 | How high the tallest peaks reach, as a fraction of the canvas. |
| `roughness` | Roughness | 0.45 | 0 to 1 | Gentle hills or jagged peaks. |
| `haze` | Haze | 0.6 | 0 to 1 | How much the far ridges fade into the distance. |
| `mist` | Mist | 0.45 | 0 to 1 | Mist pooling in the valleys between ridges. |
| `rim` | Rim light | 0.5 | 0 to 1 | Light catching the crests. |
| `speed` | Drift | 0.2 | 0 to 2 | How fast the ridges slide past (near ones faster). |
| `scale` | Scale | 1 | 0.3 to 3 | Width of the mountains. |
| `seed` | Seed | 0 | 0 to 100 | A different range. |

## Default palette

- `oklch(0.09 0.02 270)`
- `oklch(0.36 0.06 268)`
- `oklch(0.86 0.11 190)`

## Starter

[`presets/starters/mountains.aurora`](/presets/starters/mountains.aurora)

```json
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Mountains starter",
  "palette": [
    "oklch(0.09 0.02 270)",
    "oklch(0.36 0.06 268)",
    "oklch(0.86 0.11 190)"
  ],
  "layers": [
    {
      "type": "mountains"
    }
  ]
}
```
