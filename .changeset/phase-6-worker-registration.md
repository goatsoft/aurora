---
'@goatsoft/aurora': patch
---

WebGPU now takes over on busy pages. Generators registered while the worker was still probing the GPU were dropped, so the first frame failed and every background stayed on its CSS fallback.
