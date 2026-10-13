# ADR-0007: Aurora Studio

Status: accepted · 12 October 2026

## Context

Studio is how most people will meet Aurora, so it carries the north star more than any package: it has to feel immediate, never lose work, and save files that are exactly what a hand-written preset would be. Phase 5 is done when it can recreate every classic preset from scratch and export files identical to the pack.

## Decision

- **Studio edits documents as authored**, not with defaults filled in. A value you set is written even when it equals its default (the classic presets spell some out); resetting a value (double-click a field) removes it. New layers are written in the pack's house style (`type`, `blend`, `params`, `colors`, `mix`). Opening and saving a file changes nothing, and a test rebuilds all fifteen classic presets from Studio's starting document using only the editor's operations and checks the saved bytes. The pack's three `1.0`s became `1`, the form JSON writes.
- **Every edit is a pure operation** (`editor/document.ts`) committed to an immutable history. Continuous gestures share a group key and undo as one step. Layers carry ids in each history entry, so lists animate reorders and mute/solo survive undo. While a document is invalid (a half-typed colour), the canvas keeps the last valid one and the inspector says what's wrong.
- **The canvas is the real runtime**: `<AuroraBackground>` for WebGPU and the compiled CSS fallback beside it, in viewport frames or a scrolling full page, on a dark or light page. Split view compares the two, scored by the mean ΔE-OK between the WebGPU frame (`@goatsoft/aurora/poster`'s `renderFrame`) and the fallback as the browser paints it (rasterised through an SVG `foreignObject`).
- **Nothing needs a server.** Autosave is IndexedDB; share links deflate the document into the URL hash with `CompressionStream`; posters are rendered on the GPU in the browser.
- **Files save where they came from.** Where the browser has the File System Access API (Chromium), opening a file (picker or drag and drop), opening a folder, or Save as keeps a handle, and ⌘S writes back in place; folder handles are remembered in IndexedDB and access is asked for again on the next click. Elsewhere, saving downloads the file. One `Workspace` interface covers a picked folder, a single file and the dev-server project, so the file browser and ⌘S work the same for all three, and every backend refuses to write a document that wouldn't load.
- **Dev-tool mode is a narrow write path.** The unplugin's Vite dev server (and `npx aurora studio`, a bin in the unplugin package) serve a small API that lists, reads and writes `.aurora` files. It needs the per-session token from the printed link, refuses anything outside the project (including through symlinks) or that isn't a valid document, and answers only Studio's origin and localhost, with Private Network Access headers so the hosted Studio can reach a local dev server. Saving an unchanged file never rewrites it.
- **UI stack**: vue-router 5 file routes, unplugin-auto-import (Vue, the router, and the few VueUse functions Studio uses, listed by name), unplugin-vue-components and unplugin-icons with Hugeicons, reka-ui primitives styled shadcn-style with Tailwind 4, and motion-v. No `<style>` blocks; dynamic geometry is bound, everything else is a Tailwind class. Studio's chrome stays dark glass on light pages.

## Consequences

- The colour package gained `contrastRatio`, `luminance` and `maxChroma` for the picker; the unplugin leaves `?raw` and `?url` imports to the bundler so Studio's gallery reads presets as authored.
- Studio's components are tested in the `studio` Vitest project, which extends Studio's own Vite config so auto-imports and icons resolve as in the app.
- The hosted build (`STUDIO_BASE=/studio/`) ships with the site in Phase 6; until then, dev-tool links point at a local Studio via `AURORA_STUDIO_URL`.
