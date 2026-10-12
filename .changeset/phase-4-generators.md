---
'@goatsoft/aurora': minor
'@goatsoft/aurora-vue': minor
---

Eight new generators: `mesh-gradient`, `linear-sweep`, `conic`, `grain`, and the elements `strata`, `wind`, `fire` and `water`, on a shared WGSL noise library (`NOISE`, `noiseWgsl`). Built-ins other than `aurora-fbm` load on demand (`loadGenerators`, `generatorIds`); `validateDocument` is now async. The worker no longer bundles generators: the page sends it the ones each document uses, so `registerGenerator` now works with the worker. `FILL_STYLE` is exported for bindings. `@goatsoft/aurora-vue` components are now `<script setup>` SFCs.
