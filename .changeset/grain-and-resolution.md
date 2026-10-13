---
'@goatsoft/aurora': patch
---

`configureAurora({ pixelRatio: 1 })` now renders at full device resolution. Canvases were capped at one pixel per CSS pixel, so on high-DPI screens any `pixelRatio` above 0.5 had no effect. Grain cells are now whole canvas pixels (`size` is 1 to 6, default 1), so grain no longer mottles, and the gradient starters no longer include a grain layer.
