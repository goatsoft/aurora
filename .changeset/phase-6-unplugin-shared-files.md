---
'@goatsoft/aurora-unplugin': patch
---

`.aurora` files outside the Vite project (a monorepo's shared presets) work in the dev server: their hot-update import resolves from the project instead of failing with "Failed to resolve import".
