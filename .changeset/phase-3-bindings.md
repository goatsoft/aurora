---
'@goatsoft/aurora': minor
'@goatsoft/aurora-vue': minor
'@goatsoft/aurora-unplugin': minor
---

Bindings: `<aurora-bg>` (`@goatsoft/aurora/element`) with `:state(webgpu|css)`, events and precise errors; `@goatsoft/aurora-vue` with SSR-rendered fallbacks and flash-free hydration (`<AuroraBackground>`, `useAurora()`, `<AuroraScene>`); `@goatsoft/aurora-unplugin` for typed `.aurora` imports, validated at build time with `file:line:column` errors and hot-reloaded in place. Core adds `hotUpdate`, `loadAurora` (`@goatsoft/aurora/load`), `setBackends`, accepts unplugin modules in `mountAurora`, and ships `@webgpu/types` with its declarations.
