# @goatsoft/aurora

## 0.3.1

### Patch Changes

- b9d0d95: Leave the workspace-only `@goatsoft/source` export condition out of the published `package.json`. It pointed at `src/`, which isn't published, so a project that turned the condition on (for its own workspace packages) could not resolve these packages.
- Updated dependencies [b9d0d95]
  - @goatsoft/color@0.3.1
  - @goatsoft/aurora-format@0.3.1

## 0.3.0

### Minor Changes

- 9ce137a: Add phase-preserving playback controls: `surface.pause()` / `resume()`, a Vue `paused` prop and composable option, and the custom element's boolean `paused` attribute. Paused backgrounds and documents with speed zero redraw only when their state changes. Studio uses playback state without replacing the authored speed. Named scenes share playback: mounting a paused member pauses the whole scene.
- 9ce137a: Add Ping's Background and Repeat controls, allowing transparent single-pulse overlays for interactive scenes while keeping existing defaults unchanged.
- 9ce137a: Add lazily loaded Follow, Impulse and Grab & Release controllers with declarative parameter/modifier bindings, per-layer translations and independent effect clocks. Input is coalesced to the configured frame budget, remains separate from authored documents and can redraw paused backgrounds. Expose keyboard equivalents and explicit container/drag options, honor reduced motion, and clean up capture/listeners on cancellation, visibility changes and disposal.
- 34be6e5: Add optional scene-wide signal distortion with coherent tearing, stretch, shake, vertical tracking slips and colour separation. Preserve existing rendering when omitted, expose declarative controls and validation, and apply the effect to Signal Lost. Studio can edit, save and share the effect with undo support.
  
  Add independent Pixelate and Vignette modifiers, with resolution-aware display blocks and alpha-preserving edge shading. Studio groups all three under Modifiers, separately from generators.
  
  Disable signal distortion under reduced motion and skip extra colour samples between visible bursts. Export a shared modifier control spec for Studio and generated validation/reference docs; keep Pixelate units explicit as canvas pixels.
  
  Keep complete Studio and editor descriptions while deriving lean runtime validators from the authoring schemas. Generate string literals safely with apostrophe, backslash and Unicode handling.
- 34be6e5: Add digital rain, glitch, electronic static, radar and ping generators with CSS fallbacks and art-directed cyberpunk presets.
  
  Add scan lines and phosphor display textures, and refine Signal Lost with a quieter CRT finish.

### Patch Changes

- Updated dependencies [9ce137a]
- Updated dependencies [9ce137a]
- Updated dependencies [34be6e5]
  - @goatsoft/aurora-format@0.3.0
  - @goatsoft/color@0.3.0

## 0.2.0

### Minor Changes

- e5eb3f7: Backgrounds show WebGPU sooner.
  
  - **Fix:** a background whose document came from framework state (a Vue `ref` or `reactive`) stopped the rendering worker for every background on the page, which then all started over on the main thread. Documents are now copied to plain data before they go to the worker.
  - The GPU starts while a background's generators download, its shader starts compiling as soon as it attaches, and the first frame draws without waiting for the frame budget.
  - New `prepareAurora(...sources)` starts the GPU, loads the generators and compiles the shaders for backgrounds before they mount.
  - If the worker can't render in this browser, later backgrounds go straight to the main thread instead of probing the worker again.
  - Each step to the first frame is a User Timing mark (`aurora:mount`, `aurora:generators`, `aurora:gpu`, `aurora:attach`, `aurora:frame`, `aurora:compile`), visible in the browser's Performance panel.
  - The conic generator no longer draws a line through its centre on GPUs whose `atan2` mishandles negative zero.

## 0.1.1

### Patch Changes

- 174e434: Maintenance release with no code changes: published through npm trusted publishing, so releases no longer use a long-lived npm token, and every version still carries provenance.
- Updated dependencies [174e434]
  - @goatsoft/aurora-format@0.1.1
  - @goatsoft/color@0.1.1

## 0.1.0

### Minor Changes

- 9969f55: First public release, on npm with provenance.
  
  - `@goatsoft/aurora`: the WebGPU runtime, with a CSS fallback compiled from the same layers. `mountAurora()`, the `<aurora-bg>` custom element, `loadAurora()`, `renderPoster()`, colour roles and optional attribution badges. Seventeen built-in generators, grouped as aurora and sky, gradients, weather, landscape, water and fire, and grain.
  - `@goatsoft/aurora-vue`: `<AuroraBackground>` with a server-rendered fallback, `<AuroraScene>` for one background across sections, `useAurora()`, and `<AuroraBadge>`.
  - `@goatsoft/aurora-unplugin`: import `.aurora` files in Vite, Rollup, Rolldown, esbuild, webpack and Rspack, validated at build time and hot-reloaded, plus `npx aurora studio`.
  - `@goatsoft/aurora-format`: the `.aurora` format's schema, validation, migrations and JSON Schema.
  - `@goatsoft/color`: OKLab and OKLCH colour maths, gamut mapping, ΔE-OK and CSS colour parsing.

### Patch Changes

- Updated dependencies [9969f55]
  - @goatsoft/aurora-format@0.1.0
  - @goatsoft/color@0.1.0
