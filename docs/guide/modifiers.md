---
order: 5
---

# Modifier reference

Generated from the shared modifier spec. Controls are optional; an omitted modifier stays disabled. See the [format guide](format.md#modifiers) for examples, sampling cost and rendering units.

## Signal distortion (`signal`)

Tear, stretch and shake the complete scene. Disabled under reduced motion.

| Field | Label | Default | Range | Step | Meaning |
|---|---|---|---|---|---|
| `amount` | Amount | 0.35 | 0 to 1 | 0.01 | Overall distortion strength. Zero leaves the scene unchanged. |
| `shake` | Shake | 0.25 | 0 to 1 | 0.01 | Horizontal judder during a distortion burst. |
| `tearSize` | Tear size | 0.15 | 0.02 to 0.5 | 0.01 | Height of the bands that stretch and slip sideways, relative to the scene's height. |
| `separation` | Colour separation | 0.2 | 0 to 1 | 0.01 | Separate colour channels around torn edges. Visible separation samples the scene three times; quiet frames use one sample. |
| `tracking` | Tracking | 0.15 | 0 to 1 | 0.01 | Brief vertical tracking slips during a distortion burst. |
| `frequency` | Burst rate | 0.5 | 0 to 2 | 0.01 | Burst cycles per second. Zero freezes the distortion while other layers can keep moving. |
| `seed` | Signal seed | 0 | 0 to 100 | 1 | Choose a different distortion pattern. |

## Pixelate (`pixelate`)

Display blocks in canvas pixels; their CSS size depends on devicePixelRatio and configureAurora pixelRatio.

| Field | Label | Default | Range | Step | Meaning |
|---|---|---|---|---|---|
| `size` | Block size | 8 | 1 to 64 | 1 | Block size in canvas pixels. One leaves the scene unchanged; the CSS size depends on the rendering pixel ratio. |

## Vignette (`vignette`)

Darken the edges to draw attention into the scene.

| Field | Label | Default | Range | Step | Meaning |
|---|---|---|---|---|---|
| `amount` | Darkness | 0.45 | 0 to 1 | 0.01 | Edge darkness. Zero leaves the scene unchanged. |
| `radius` | Clear radius | 0.45 | 0 to 1 | 0.01 | Size of the clear centre, relative to the scene's shorter side. |
| `softness` | Softness | 0.45 | 0.01 to 1 | 0.01 | Width of the soft transition to the dark edges, relative to the shorter scene side. |
