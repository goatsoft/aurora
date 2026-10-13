---
'@goatsoft/aurora': patch
'@goatsoft/aurora-vue': patch
---

Startup and recovery fixes:

- An imported module paints its precompiled CSS fallback until its generators have loaded, and `<AuroraBackground>` keeps its server-rendered fallback until a plain document's generators load, so a lazily loaded generator no longer leaves the background blank.
- A background that fell back to CSS can return to WebGPU: it gets a fresh canvas and the canvas is shown again.
- `update()` with a new source stops following the old module's hot updates.
- New `onError` mount option (also `@error` on `<AuroraBackground>` and `aurora-error` on `<aurora-bg>`) says why a background is on CSS when WebGPU is available.
- The main-thread renderer releases its GPU device 10 seconds after its last background goes.
- `checkDocument()` validates generators and parameters synchronously, against the generators already loaded.
