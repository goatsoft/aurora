---
order: 17
---

# Bridge & transit (`transit`)

City: suspension bridge and transit viaduct with moving trains.

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Bridge & transit starter",
  "palette": [
    "oklch(0.08 0.02 255)",
    "oklch(0.88 0.13 80)",
    "oklch(0.84 0.12 215)"
  ],
  "layers": [
    {
      "type": "transit"
    }
  ]
}
```

This is [`presets/starters/transit.aurora`](/presets/starters/transit.aurora): the generator alone, with its defaults.

## Colours

A layer's `colors` picks 3 palette colours, in the order below. To recolour part of the background, change the palette colour in that position.

| Position | Paints | Default |
|---|---|---|
| 0 | Bridge towers, cables and viaduct deck | `oklch(0.08 0.02 255)` |
| 1 | Deck lamps, cable lights and eastbound trains | `oklch(0.88 0.13 80)` |
| 2 | Westbound express trains and beacons | `oklch(0.84 0.12 215)` |

## Parameters

Every parameter is optional; one you leave out uses its default.

| Name | Label | Default | Range | What it does |
|---|---|---|---|---|
| `altitude` | Deck height | 0.26 | 0.08 to 0.65 | Deck height. |
| `towers` | Towers | 2 | 0 to 3 | Towers; 0 for viaduct. |
| `span` | Tower height | 0.34 | 0.15 to 0.55 | Tower height. |
| `cables` | Cables | 0.75 | 0 to 1 | Cables and piers. |
| `trains` | Trains | 0.85 | 0 to 1 | Trains. |
| `lights` | Lights | 0.75 | 0 to 1 | Lights. |
| `speed` | Speed | 0.5 | 0 to 2 | Speed. |
| `seed` | Seed | 0 | 0 to 100 | Seed. |

## Implementation note

Built on the shared noise library: `hash`.
