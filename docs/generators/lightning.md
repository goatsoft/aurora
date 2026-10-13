---
order: 11
---

# Lightning (`lightning`)

Air: forked lightning and sky flashes, for storms.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Lightning starter",
  "palette": [
    "oklch(0.82 0.06 255)",
    "oklch(0.98 0.03 250)"
  ],
  "layers": [
    {
      "type": "lightning"
    }
  ]
}
```

This is [`presets/starters/lightning.aurora`](/presets/starters/lightning.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 2 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Sky flash | `oklch(0.82 0.06 255)` |
| 1 | Bolt | `oklch(0.98 0.03 250)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `frequency` | Frequency | 0.5 | 0 to 1 | How often lightning strikes. |
| `flash` | Flash | 0.6 | 0 to 1 | How brightly the sky lights up. |
| `bolt` | Bolt | 1 | 0 to 1 | How bright the bolt is; 0 for flashes only. |
| `width` | Width | 1 | 0.3 to 3 | Thickness of the bolt. |
| `reach` | Reach | 0.85 | 0.2 to 1 | How far down the canvas a bolt can reach. |
| `branches` | Branches | 0.5 | 0 to 1 | How often a bolt forks. |
| `seed` | Seed | 0 | 0 to 100 | A different storm. |

## Implementation note

Built on the shared noise library: `hash`.
