---
'@goatsoft/aurora': minor
---

New `@goatsoft/aurora/roles` entry point: `COLOR_ROLES` says what each palette colour paints for every built-in generator, for editors and docs. The built-in generators are now listed by kind (aurora and night sky, gradients, weather, landscape, water and fire, then grain), so `generatorIds()` and the "not a known generator" message use that order.
