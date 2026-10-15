# ADR-0013: Interaction modules and transient playback

Status: accepted. Implements issue #42.

## Decision

`.aurora` files declare Follow, Impulse and Grab & Release modules and bindings. A binding adds normalized `x`, `y`, `strength` or impulse `travel` to an existing control, with an authored multiplier. Layer `offsetX` and `offsetY` are scene-space translations; `time` overrides that layer's clock for effects such as a tap-triggered Ping. Negative multipliers produce a repel response. Module activation can use hover, focus or either. Generator and modifier ranges remain the source of truth for clamping.

The format's shared `INTERACTIONS` metadata defines labels, applicable controls, defaults, ranges and binding limits. It drives generated authoring/runtime schemas and reference docs, following ADR-0012, and Studio reads the same definitions. Runtime validators exclude editor metadata.

Pointer positions, gestures, velocities, active impulses and playback never enter the document. A lazily loaded main-thread controller samples them at the configured frame budget and sends plain rendering state through the existing backend. No shader is compiled for each input event. Unconfigured documents retain their shader and golden images. Configured documents add one vec4 per layer for transient translation and an optional independent effect clock.

Ambient pause stores a frozen epoch and advances the clock origin by the duration of each pause when resuming. Named scenes own this clock: pausing or resuming any member affects every member, and later members inherit the current phase and pause state. The renderer draws a paused or speed-zero surface only when dirty. Input may redraw a paused surface until its response settles without advancing ambient time. CSS drift uses `animation-play-state`.

## Input and accessibility

Input belongs to a meaningful host container, never the decorative canvas. Bindings default to the background's containing element; core and Vue allow an explicit interaction target. Controller methods provide keyboard equivalents for controls outside the aria-hidden background. Grab is explicitly enabled on the target: a host must opt into drag gestures. Other modules use passive pointer listeners and preserve touch scrolling. Interactive descendants do not initiate gestures.

Impulses have a fixed bound of four per module, newest first; bindings choose a slot. Repeated taps evict the oldest pulse. Release velocity is bounded in scene UV per second, and integration uses bounded timesteps. Cancellation, lost capture, multiple touches, hidden/off-screen surfaces and disposal clear active gestures and release capture. Reduced motion makes Follow immediate, removes elastic overshoot and kinetic signal distortion, and uses a quiet static impulse response.

## Consequences

Studio edits only module settings through normal history, save and share. Preview input and playback are temporary. Gallery playgrounds expose separate keyboard controls and pause buttons. The worker does no input processing and receives only the already-resolved document and transient layer transforms. Shared-scene coordinates are normalized through the surface's scene rectangle.
