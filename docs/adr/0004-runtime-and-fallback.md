# ADR-0004: Runtime and fallback

Status: accepted · 12 October 2026 · Ports and supersedes the original runtime ADR for Aurora

## Context

Backgrounds are decoration: they must never cost input latency, never flash, never lie about what is on screen, and never break the page when the GPU misbehaves. The original runtime met most of this for one shader. Aurora needs the same for any layer stack, on any GOATsoft site.

## Decision

- **Composer.** One WGSL shader per layer stack, assembled from generator modules (namespaced), `@goatsoft/color` WGSL, and premultiplied blend functions. It is cached by a *shader key* (generator types, blends, mix spaces, mask types, fade, output space), so documents that differ only in values share a shader and a pipeline, and Studio edits that change values never recompile.
- **Uniforms.** A flat `array<vec4f, N>`: two frame slots, then per layer `[opacity, params…]`, an optional mask slot, and colours. Palette colours are converted on the CPU once: exact gamma sRGB for `mix: "srgb"`, OKLab gamut-mapped into the output space for `mix: "oklab"`.
- **One device, one worker** (ADR-0079): leases, a 4 s probe, canvases transferred only after the worker proves it can render, the last lease terminates the worker. Every surface shares one fps budget (30 by default) and one submit per tick, and the next batch is never queued before `onSubmittedWorkDone`. Canvases render at half the device pixel ratio, capped at 1280 px per axis; `pixelRatio: 1` renders at full device resolution, and nothing renders above it. All of this is configurable with `configureAurora`.
- **Fallback ladder.** Worker WebGPU, then main-thread WebGPU (loaded on demand), then CSS. There is no WebGL. A transferred canvas is never reused on the main thread; after transfer, failure means CSS.
- **Truthfulness.** A surface paints the CSS fallback synchronously at mount, and says `data-aurora="webgpu"` only after the renderer reports that a submitted frame has completed. It then crossfades over 300 ms (instantly under reduced motion) and stops painting the CSS.
- **Device loss** is recovered once, transparently (new device, reconfigured contexts, a fresh first frame); a second loss, a failed recovery or any uncaptured error falls back to CSS.
- **Scenes.** Surfaces that join a named scene share one clock origin and one document-space field: each renders its own rectangle of the union, so separate panels read as one continuous background.
- **CSS fallback compiler.** Each generator supplies gradients that approximate it; the compiler stacks them top first with matching `background-blend-mode`, adds edge-fade masks, and offers a slow transform-only drift (`@keyframes aurora-drift`), never a repainting filter. Per-layer masks have no background-stack equivalent and are left out.
- **Budgets.** `pnpm size` (part of `pnpm verify`) fails the build if the main-thread entry or the worker exceeds 10 kB gzip, or a generator exceeds 2 kB.

## Testing

Headless SwiftShader in Chromium 141 loses the device the moment a WebGPU canvas is configured and presented ("A valid external Instance reference no longer exists"), with or without a display. So:

- Rendering is verified on the real GPU through a texture-backed canvas: the renderer's output is bit-identical to the composed shader, and scene members tile seamlessly.
- Classic parity is verified by rendering the original WGSL and ours to textures: 0 differing pixels for all presets.
- Lifecycle rules (budget, completion gating, recovery, reduced motion, leases) are verified with a scripted fake GPU and fake workers.
- With the real worker in a real browser, a test asserts the surface never claims WebGPU before a frame, which here exercises the device-loss → CSS path end to end.
- On-screen presentation itself needs acceptance on real devices.

## Consequences

- Generators can be added in code with `registerGenerator`; `.aurora` files still never carry code.
- A layer stack change compiles a new pipeline asynchronously; the surface keeps its last frame until it is ready.

## Review fixes, October 2026

- **The fallback survives startup.** A surface mounted from an imported module paints the module's precompiled CSS until the generators its layers use have loaded; compiling it again before then would leave those layers out. Surfaces expose `ready`, and `<AuroraBackground>` keeps its server-rendered fallback until it resolves.
- **CSS and back.** Falling back to CSS replaces the canvas element: a canvas handed to the worker can't be transferred again, so a later restart (reduced motion turned off, say) gets a fresh one, and returning to WebGPU clears the `display: none` the fallback set.
- **Hot updates follow the current source.** A module's watcher applies its hot updates in place; `update()` with a different source (another module or a plain document) detaches the old watcher, so an edit to a file no longer in use can't bring it back.
- **Errors are reported, not thrown.** `onError` (and `@error`, and `aurora-error`) says why a background is on CSS when WebGPU is available; the fallback stays on screen.
- **The main-thread renderer is released when idle**, 10 seconds after its last surface, rather than kept for the page's lifetime. The worker already terminates with its last surface.
