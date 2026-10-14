---
'@goatsoft/aurora': minor
---

Backgrounds show WebGPU sooner.

- **Fix:** a background whose document came from framework state (a Vue `ref` or `reactive`) stopped the rendering worker for every background on the page, which then all started over on the main thread. Documents are now copied to plain data before they go to the worker.
- The GPU starts while a background's generators download, its shader starts compiling as soon as it attaches, and the first frame draws without waiting for the frame budget.
- New `prepareAurora(...sources)` starts the GPU, loads the generators and compiles the shaders for backgrounds before they mount.
- If the worker can't render in this browser, later backgrounds go straight to the main thread instead of probing the worker again.
- Each step to the first frame is a User Timing mark (`aurora:mount`, `aurora:generators`, `aurora:gpu`, `aurora:attach`, `aurora:frame`, `aurora:compile`), visible in the browser's Performance panel.
- The conic generator no longer draws a line through its centre on GPUs whose `atan2` mishandles negative zero.
