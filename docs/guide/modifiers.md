---
order: 5
---

# Modifier reference

Generated from the shared modifier spec. Controls are optional; an omitted modifier stays disabled. See the [format guide](format.md#modifiers) for examples, sampling cost and rendering units.

## Signal distortion (`signal`)

Tear, stretch and shake the complete scene. Disabled under reduced motion.

| Field | Label | Default | Range | Step | Meaning |
|---|---|---|---|---|---|
| `amount` | Amount | 0.35 | 0 to 1 | 0.01 | Distortion; 0 bypasses. |
| `shake` | Shake | 0.25 | 0 to 1 | 0.01 | Horizontal burst judder. |
| `tearSize` | Tear size | 0.15 | 0.02 to 0.5 | 0.01 | Scene-relative band height. |
| `separation` | Colour separation | 0.2 | 0 to 1 | 0.01 | RGB separation during bursts. |
| `tracking` | Tracking | 0.15 | 0 to 1 | 0.01 | Vertical burst slips. |
| `frequency` | Burst rate | 0.5 | 0 to 2 | 0.01 | Bursts/second; 0 freezes. |
| `seed` | Signal seed | 0 | 0 to 100 | 1 | Distortion pattern seed. |

## Pixelate (`pixelate`)

Display blocks in canvas pixels; their CSS size depends on devicePixelRatio and configureAurora pixelRatio.

| Field | Label | Default | Range | Step | Meaning |
|---|---|---|---|---|---|
| `size` | Block size | 8 | 1 to 64 | 1 | Canvas pixels/block; 1 bypasses. |

## Vignette (`vignette`)

Darken the edges to draw attention into the scene.

| Field | Label | Default | Range | Step | Meaning |
|---|---|---|---|---|---|
| `amount` | Darkness | 0.45 | 0 to 1 | 0.01 | Edge darkness; 0 bypasses. |
| `radius` | Clear radius | 0.45 | 0 to 1 | 0.01 | Clear radius / shorter side. |
| `softness` | Softness | 0.45 | 0.01 to 1 | 0.01 | Edge softness / shorter side. |
