---
order: 16
---

# Skyline (`skyline`)

City: layered towers, lit windows and beacons.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Skyline starter",
  "palette": [
    "oklch(0.08 0.025 250)",
    "oklch(0.32 0.065 232)",
    "oklch(0.92 0.08 85)",
    "oklch(0.75 0.11 218)"
  ],
  "layers": [
    {
      "type": "skyline"
    }
  ]
}
```

This is [`presets/starters/skyline.aurora`](/presets/starters/skyline.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 4 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Nearest building silhouettes | `oklch(0.08 0.025 250)` |
| 1 | Farther towers and atmospheric haze | `oklch(0.32 0.065 232)` |
| 2 | Lit windows and rooftop beacons | `oklch(0.92 0.08 85)` |
| 3 | Sky glow and sunlit glass facades | `oklch(0.75 0.11 218)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `rows` | Rows | 5 | 1 to 5 | Tower rows. |
| `density` | Density | 6 | 2.5 to 14 | Tower density. |
| `height` | Height | 0.54 | 0.15 to 0.85 | Max height. |
| `spires` | Spires | 0.55 | 0 to 1 | Spires. |
| `windows` | Windows | 0.82 | 0 to 1 | Windows. |
| `rim` | Rim light | 0.45 | 0 to 1 | Edge rim. |
| `haze` | Haze | 0.65 | 0 to 1 | Haze. |
| `speed` | Drift | 0 | 0 to 2 | Drift. |
| `seed` | Seed | 0 | 0 to 100 | Seed. |

## Implementation note

Built on the shared noise library: `hash`.
