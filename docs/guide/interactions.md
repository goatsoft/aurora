---
title: Interactions
description: Make light follow the pointer, emit a pulse on a tap, or pull a scene and let it spring back.
order: 7
---

# Interactions

Interaction modules turn a background into a responsive scene. They compose with existing generators and modifiers, and load only when a document declares them. The background stays decorative and `aria-hidden`; input belongs to a container around it, with separate meaningful controls for keyboard users.

## Follow the pointer

Add a Follow module to your `.aurora` file. Here, horizontal and vertical movement gently displace the first layer:

```json
"interactions": [
  {
    "type": "follow",
    "smoothing": 0.65,
    "bindings": [
      { "layer": 0, "parameter": "offsetX", "input": "x", "amount": 0.12 },
      { "layer": 0, "parameter": "offsetY", "input": "y", "amount": 0.08 }
    ]
  }
]
```

`x` and `y` are centered scene coordinates: left/top is −0.5, the center is 0, and right/bottom is 0.5. Bindings add to the authored value and clamp to the generator's normal range. Negative amounts repel. Give distant layers small offset amounts and foreground layers larger ones to create depth parallax.

`strength` scales the response. `smoothing` controls Follow's easing, and `decay` controls return duration in seconds. `activation` chooses hover, focus or either. See the generated [interaction reference](interaction-reference.md) for defaults, ranges and available controls. Moving away returns the scene to its authored appearance. Follow's `strength` input reflects movement and decays when input stops, so interference can settle while the pointer stays in place.

Bindings can target an existing numeric generator parameter, `opacity`, `offsetX`, `offsetY` or an independent layer `time`. A binding without a layer can target a signal control such as `signal.amount`, provided the document has a signal modifier. For example, bind Follow's `strength` to `signal.amount` for interference that responds to movement.

## Tap to ping

Use an Impulse module with a Ping layer authored at zero opacity and `params: { "background": 0, "repeat": 0 }`. Bind `x` and `y` to its origin, `strength` to opacity, and `travel` to its independent clock:

```json
{
  "type": "impulse",
  "decay": 2,
  "bindings": [
    { "layer": 1, "parameter": "x", "input": "x" },
    { "layer": 1, "parameter": "y", "input": "y" },
    { "layer": 1, "parameter": "opacity", "input": "strength" },
    { "layer": 1, "parameter": "time", "input": "travel" }
  ]
}
```

Each tap starts an effect that decays to rest. `travel` is the number of seconds since activation; it advances independently of ambient playback, so a paused background can still emit a travelling ring. Pulse slots select the newest or older active impulses; see [binding controls](interaction-reference.md#bindings). Bind each slot to another Ping layer for overlapping rings. Taps on links, buttons, form controls and editable content do not activate a gesture. Scrolling a touch container does not become a tap.

## Grab and release

A Grab module uses the displacement from the drag's starting point. Bind its `x`/`y` to layer offsets, or its `strength` to signal distortion. Releasing supplies a bounded velocity and returns the scene with a spring. Higher `damping` values settle more quickly. Pointer cancellation and multiple touches reset the gesture.

Pointer dragging is opt-in because it reserves touch gestures on the chosen container. In Vue, pass `drag` to the background and select the container explicitly:

```vue
<AuroraBackground :src="scene" :interaction-target="playground" drag />
```

With core, use `mountAurora(host, scene, { interactionTarget: playground, drag: true })`. Leave `drag` off when the page should scroll normally. Vue defaults input to the background's parent; core defaults to its host. A named scene maps input through its shared geometry so neighbouring surfaces receive the same scene coordinate when they share a container.

`background.setInteractionTarget(container, drag)` changes input without remounting or resetting playback. Vue's reactive `interactionTarget` and `drag` options do the same.

The custom element defaults input to its parent. `<aurora-bg src="/scene.aurora" drag>` opts into dragging; `element.interactionTarget` selects another container, and `element.interactions` exposes the same keyboard methods once loaded.

## Keyboard and application controls

The surface exposes the same interactions programmatically after `ready`. Connect these methods to accessible buttons or a focused playground:

```ts
const background = mountAurora(host, scene, { interactionTarget: playground })
await background.ready

background.interactions?.move(0.75, 0.4)
background.interactions?.activate(0.75, 0.4)
background.interactions?.grab(0.5, 0.5)
background.interactions?.move(0.65, 0.5)
background.interactions?.release()
background.interactions?.leave()
background.interactions?.reset()
```

Programmatic coordinates are normalized to the complete scene. Keep controls outside the background's aria-hidden element. Vue exposes the surface through the component's `surface` or the `useAurora` composable.

## Playback and reduced motion

Interaction state never changes the authored document, save/share output or undo history. Pausing holds ambient phase; input redraws only until its response settles. Off-screen and hidden scenes stop input work, clear gestures and release capture. Disposal removes listeners and restores the container's touch behavior.

Reduced motion makes Follow immediate, removes elastic overshoot on release and bypasses kinetic signal distortion. An impulse shows a quiet still response, then expires with one update. The CSS fallback shows the authored scene; GPU translations and independent effect clocks are not reproduced by CSS.

To preview that policy, core accepts `{ reducedMotion: true }` and `background.setReducedMotion(true)`. Vue accepts a `reducedMotion` prop or reactive composable option. Turning the preview off never overrides the visitor's own preference. Studio uses this same policy for its Reduced motion control.

The custom element accepts `reduced-motion` and a boolean `element.reducedMotion` property for the same opt-in preview.
