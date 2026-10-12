---
'@goatsoft/aurora': minor
'@goatsoft/aurora-unplugin': minor
---

`@goatsoft/aurora/poster`: `renderFrame` (one frame as straight-alpha RGBA8) and `renderPoster` (as a PNG). The unplugin serves Aurora Studio's dev-tool API from the Vite dev server and prints a link, so Studio can open and save the project's `.aurora` files; `npx aurora studio` does the same without Vite. `createStudioApi` and `studioLink` are exported for custom servers.
