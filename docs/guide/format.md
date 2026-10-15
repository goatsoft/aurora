---
title: The .aurora format
description: The declarative JSON file every background is, field by field.
order: 2
---

# The .aurora format

A `.aurora` file is a JSON file containing colours, layers and animation settings. It contains settings, not executable shader code. Editors autocomplete it from the JSON Schema at [`/schema/v1.json`](https://aurora.goatsoft.io/schema/v1.json).

```aurora
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Ember",
  "canvas": { "fade": "y" },
  "motion": { "speed": 1, "reduced": "still" },
  "palette": ["oklch(0.16 0.04 30)", "oklch(0.62 0.21 35)", "oklch(0.86 0.16 75)"],
  "layers": [
    { "type": "fire", "colors": [0, 1, 2] },
    { "type": "grain", "blend": "overlay", "opacity": 0.5 }
  ]
}
```

## The document

| Field | Required | Description |
|---|---|---|
| `format` | required | Always `"aurora"`. |
| `version` | required | The format version, `1`. Older files are migrated forward on load. |
| `name` | required | What Studio and error messages call it. |
| `palette` | required | Colours, in any CSS colour syntax Aurora understands; OKLCH is the native one. |
| `layers` | required | The stack, bottom first. |
| `canvas` | | Edge fade, fixed positioning and parallax. |
| `motion` | | Global speed and reduced-motion behaviour. |
| `fallback` | | `{ "mode": "auto" }` (the default) or hand-tuned CSS. |

## Layers

Each layer is one generator. Its `type` is the generator's id and its `params` are that generator's parameters. All parameters are optional; omitted parameters use the generator's defaults. Each [generator's page](../generators/README.md) lists its parameters and what each of its colours paints.

| Field | Default | Description |
|---|---|---|
| `type` | | The generator, such as `aurora-fbm` or `clouds`. |
| `colors` | `[0, 1, 2]` | Palette indices the generator uses, in its order. |
| `blend` | `normal` | `normal`, `screen`, `add`, `multiply` or `overlay`, onto the layers below. |
| `opacity` | `1` | The layer's opacity. |
| `mix` | `oklab` | Where colours blend: `oklab`, or `srgb` for exact parity with older sRGB shaders. |
| `mask` | | A `linear` (angle, start, end) or `radial` (x, y, start, end) fade. |

## Canvas and motion

`canvas.fade` fades the edges: `"y"` top and bottom, `"x"` left and right. `canvas.fixed` pins the background to the viewport, and `canvas.parallax` (0 to 1) moves it more slowly than the page.

`motion.speed` multiplies time, and 0 freezes the background. `motion.reduced` decides what happens under `prefers-reduced-motion`: `"still"` renders one frame, `"slow"` runs at a tenth of the speed, and `"css"` shows the CSS fallback.

## Validation

Files are checked against the schema and then against each generator: unknown types and parameters get "did you mean" suggestions, and colour indices must exist in the palette. With the bundler plugin this happens at build time, with errors at the file, line and column.

## Modifiers

Modifiers transform the whole background and are separate from generators. Enable them independently in **Modifiers**.

### Signal distortion

An optional scene effect tears, stretches and shakes the complete composition. In Studio, open **Modifiers → Signal distortion**.

```json
"modifiers": {
  "signal": {
    "amount": 0.65,
    "shake": 0.55,
    "tearSize": 0.12,
    "separation": 0.55,
    "tracking": 0.3,
    "frequency": 0.65,
    "seed": 12
  }
}
```

See the [modifier reference](modifiers.md) for defaults, ranges and control descriptions. Frequency zero freezes the distortion while other layers can keep moving.

Omit `modifiers` for the normal rendering path. An empty `signal` object uses the defaults; an amount of zero leaves the scene unchanged. Global motion scales the effect. Under `prefers-reduced-motion`, signal distortion is disabled for both `still` and `slow`; other layers follow their configured motion policy. CSS fallback shows the undistorted background.

Colour separation samples the full composition three times during visible bursts. Between bursts, or below half a canvas pixel of separation, Aurora uses one sample. Set `separation` to zero when you only need displacement. This field requires a version of Aurora and `@goatsoft/aurora-format` that supports scene modifiers; older strict validators reject it.

### Pixelate

`"modifiers": { "pixelate": { "size": 8 } }` samples the scene in square display blocks. Size is measured in canvas pixels; 1 leaves the scene unchanged. Its CSS size depends on `devicePixelRatio`, `configureAurora({ pixelRatio })` and the render size cap. At the default pixel ratio, size 8 spans 8 CSS pixels on a 2x screen and 16 CSS pixels on a 1x screen. Fine-detail generators adapt to the lower effective resolution.

### Vignette

`"modifiers": { "vignette": { "amount": 0.45, "radius": 0.45, "softness": 0.45 } }` darkens the edges without changing transparency. Radius and softness are relative to the shorter scene side. Zero amount leaves the scene unchanged.

Combine these keys in one `modifiers` object. Aurora applies signal distortion first, pixelate sampling next, and vignette last. The CSS fallback keeps the original composition.
