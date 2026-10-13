---
order: 12
---

# Mountains (`mountains`)

Earth: layered mountain ridges that fade into haze, with mist in the valleys.

```aurora
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

This is [`presets/starters/mountains.aurora`](/presets/starters/mountains.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Nearest ridges | `oklch(0.09 0.02 270)` |
| 1 | Farthest ridges and the haze | `oklch(0.36 0.06 268)` |
| 2 | Rim light on the crests, and valley mist | `oklch(0.86 0.11 190)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `ridges` | Ridges | 3 | 1 to 6 | How many layers of mountains. |
| `peaks` | Peaks | 1.2 | 1 to 8 | How many peaks stand across the nearest ridge (farther ridges have a few more). Raise it for a busier range. |
| `height` | Height | 0.45 | 0.1 to 0.95 | How high the tallest peaks reach, as a fraction of the canvas. |
| `roughness` | Roughness | 0.3 | 0 to 1 | Higher gives jagged peaks; lower gives gentle hills. |
| `haze` | Haze | 0.6 | 0 to 1 | How much the far ridges fade into the distance. |
| `mist` | Mist | 0.45 | 0 to 1 | Mist pooling in the valleys between ridges. |
| `rim` | Rim light | 0.5 | 0 to 1 | Light catching the crests. |
| `speed` | Drift | 0 | 0 to 2 | How fast the ridges slide past, near ones faster, for a parallax. 0 keeps them still, like real mountains. |
| `scale` | Scale | 1 | 0.3 to 3 | Higher makes the mountains wider. |
| `seed` | Seed | 0 | 0 to 100 | A different range. |

## Implementation note

Built on the shared noise library: `fbm`, `hash`.
