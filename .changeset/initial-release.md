---
'@goatsoft/aurora': minor
'@goatsoft/aurora-vue': minor
'@goatsoft/aurora-unplugin': minor
'@goatsoft/aurora-format': minor
'@goatsoft/color': minor
---

First public release, on npm with provenance.

- `@goatsoft/aurora`: the WebGPU runtime, with a CSS fallback compiled from the same layers. `mountAurora()`, the `<aurora-bg>` custom element, `loadAurora()`, `renderPoster()`, colour roles and optional attribution badges. Seventeen built-in generators, grouped as aurora and sky, gradients, weather, landscape, water and fire, and grain.
- `@goatsoft/aurora-vue`: `<AuroraBackground>` with a server-rendered fallback, `<AuroraScene>` for one background across sections, `useAurora()`, and `<AuroraBadge>`.
- `@goatsoft/aurora-unplugin`: import `.aurora` files in Vite, Rollup, Rolldown, esbuild, webpack and Rspack, validated at build time and hot-reloaded, plus `npx aurora studio`.
- `@goatsoft/aurora-format`: the `.aurora` format's schema, validation, migrations and JSON Schema.
- `@goatsoft/color`: OKLab and OKLCH colour maths, gamut mapping, ΔE-OK and CSS colour parsing.
