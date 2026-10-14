# @goatsoft/aurora

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
