---
order: 9
---

# Fog (`fog`)

Air: drifting banks of low-lying fog and mist that weave across the horizon.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Fog starter",
  "palette": [
    "oklch(0.32 0.04 245)",
    "oklch(0.78 0.04 225)"
  ],
  "layers": [
    {
      "type": "fog"
    }
  ]
}
```

This is [`presets/starters/fog.aurora`](/presets/starters/fog.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 2 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Deep fog bank body | `oklch(0.32 0.04 245)` |
| 1 | Lit upper mist crest | `oklch(0.78 0.04 225)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `density` | Density | 0.6 | 0 to 1 | How thick the fog is. |
| `altitude` | Altitude | 0.72 | 0 to 1 | Where the fog bank sits vertically (0 = top, 1 = bottom). |
| `spread` | Spread | 0.32 | 0.08 to 0.8 | Vertical thickness of the fog bank. |
| `billow` | Billow | 0.5 | 0 to 1 | How much the fog curls into rising wisps instead of a flat sheet. |
| `speed` | Speed | 0.3 | 0 to 2 | How fast the fog drifts. |
| `angle` | Angle | 90 deg | 0 to 360 | Direction the fog drifts, CSS convention (90 = left to right). |
| `seed` | Seed | 0 | 0 to 100 | A different bank of fog. |

## Implementation note

Built on the shared noise library: `fbm`.
