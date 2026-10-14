# @goatsoft/aurora-unplugin

## 0.2.0

### Patch Changes

- Updated dependencies [e5eb3f7]
  - @goatsoft/aurora@0.2.0

## 0.1.1

### Patch Changes

- 174e434: Maintenance release with no code changes: published through npm trusted publishing, so releases no longer use a long-lived npm token, and every version still carries provenance.
- Updated dependencies [174e434]
  - @goatsoft/aurora@0.1.1
  - @goatsoft/aurora-format@0.1.1

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
  - @goatsoft/aurora@0.1.0
  - @goatsoft/aurora-format@0.1.0
