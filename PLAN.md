# Aurora: plan

Status: approved · 12 October 2026 · GOATsoft

## 1. Vision

Aurora is a **GOATsoft library for animated backgrounds that are WebGPU-only and fall back to CSS**. It ships with a builder.

- You design a background in **Aurora Studio** and export a `.aurora` file.
- Any GOATsoft site drops that file in with one line. WebGPU renders it. Browsers without WebGPU get a generated CSS fallback, so there is no WebGL or GLSL path at all.
- The first preset pack is the aurora from the GOAT website, reproduced exactly. The format and builder also allow other background types (mesh gradients, waves, grain and others). All of them are authored and blended in **OKLab/OKLCH**.
- The project produces four things: the **library**, the **Studio** (a dev tool that we also host), a **marketing site** and a **docs site**. The docs run on our own markdown-it pipeline, which is what VitePress uses, without VitePress itself.

### Why this is a rewrite and not a refactor

The current checkpoint was written by a model, and its config schema (`blur`, `particleCount`, `gradientRotation`) does not describe the GOAT shader at all. It has one shader and no layer model or OKLab. Two ideas are worth carrying forward:
- `scene.ts`: several panels sharing one continuous coordinate space and clock.
- `sharedSurface.ts`: device sharing. This one gets superseded by the GOAT worker design.

The plan is to freeze the current tree on a `legacy/checkpoint-2026-09` branch and start a clean workspace.

## 2. What exists in GOAT (the parity target)

These facts come from the GOAT source (`GOAT/web/src/lib/aurora-*`) and ADR-0041, ADR-0044, ADR-0077 and ADR-0079.

**Shader.** Domain-warped fbm built on value noise:
- 4 octaves, rotation `mat2(0.8,0.6,-0.6,0.8)`, lacunarity 2.02, gain 0.5.
- Band: `smoothstep(.48,.66,f)*(1-smoothstep(.66,.9,f))`.
- Glow: `pow(f,4)`.
- Colour is mixed in sRGB, not OKLab. Output is premultiplied.

**Parameters.** `colors[3]`, `intensity`, `scale`, `speed`, `seed`, `stretch`, `sweep`, `fade`, `fixed`, `parallax`.

**Palettes and usages.** Five palettes: `blue`, `violet`, `green`, `indigo` and `aurora`. Eight placements use them:
- ambient page background
- hero
- pillars
- stack tile
- download cards
- DocDialog
- docs page background
- docs hero

**Runtime (ADR-0079).**
- One module worker per page, holding one WebGPU device and one pipeline.
- Canvases are leased as OffscreenCanvas. Each canvas transfers only after the worker probe succeeds.
- 30 fps shared budget. A new batch is never queued until `onSubmittedWorkDone`.
- 0.5× DPR, capped at 1280 px per axis.
- IntersectionObserver with `rootMargin 20%` pauses off-screen surfaces, and `visibilitychange` pauses hidden tabs.
- Reduced motion renders once per input change.
- Device loss or a worker failure falls back to CSS.
- The last lease terminates the worker.

**CSS fallback.** Three radial-gradients at alpha `0.28 × intensity`.

**Copies.** GOATsoft.io holds a second, main-thread-only copy (its ADR-0005), with monochrome palettes and no blend modes.

> Every GOATsoft site will consume this library, so those two copies and their GLSL paths get deleted in Phase 6.

## 3. Architecture

```
aurora/                          pnpm workspace · Vite 8 · Vue 3.5 · TS 5.9 · Node ≥22
├─ packages/
│  ├─ format/        @goatsoft/aurora-format   .aurora schema, validation, migrations, OKLab math (pure TS, 0 deps)
│  ├─ core/          @goatsoft/aurora          WebGPU runtime: worker pool, WGSL composer, scenes, CSS fallback
│  ├─ generators/    (inside core, tree-shaken) WGSL modules: aurora-fbm, mesh, waves, grain, conic, noise-field…
│  ├─ element/       @goatsoft/aurora/element  <aurora-bg> custom element (framework-free, any GOATsoft site)
│  ├─ vue/           @goatsoft/aurora-vue      <AuroraBackground>, useAurora(), scene provider
│  ├─ unplugin/      @goatsoft/aurora-unplugin `import hero from './hero.aurora'` (Vite/Rollup/esbuild/webpack)
│  └─ studio/        @goatsoft/aurora-studio   Aurora Studio – the builder (vue-router 5 file routes; `npx aurora studio`)
├─ docs/             docs content (.md) – shipped in the package for the site to render
└─ presets/          goat.aurora-pack, goatsoft-mono.aurora-pack, starter packs

GOATsoft/ (existing monorepo, goatsoft/GOATsoft · pnpm + Turborepo)
├─ packages/docs-kit/        @goatsoft/docs-kit   markdown-it pipeline + Vite plugin (our "VitePress"; reusable by every GOATsoft site)
└─ apps/aurora.goatsoft.io/  marketing + /docs + hosted /studio (prerendered SSG) → published to goatsoft/aurora.goatsoft.io (ADR 0008 pattern)
```

**Repo split.** `goatsoft/aurora` holds the library and Studio, everything published as `@goatsoft/*`. The website and the docs pipeline live in the GOATsoft monorepo beside `apps/goatsoft.io`, following the same source-here, publish-there pattern (GOATsoft ADR 0008). The site consumes the published Aurora packages, so it always runs the real library.

### 3.1 The `.aurora` format (v1)

The file is declarative JSON. It never contains arbitrary WGSL, because a file must not be able to run code.

```jsonc
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora", "version": 1,
  "name": "GOAT Hero",
  "canvas": { "fade": "y", "fixed": false, "parallax": 0 },
  "motion": { "speed": 1, "reduced": "still" },        // still | slow | css
  "palette": ["oklch(0.68 0.16 245)", "oklch(0.56 0.22 285)", "oklch(0.58 0.25 310)"],
  "layers": [
    { "type": "aurora-fbm", "blend": "screen", "opacity": 1,
      "params": { "intensity": 0.38, "scale": 1.1, "speed": 0.09, "seed": 3, "stretch": 0.45, "sweep": 0 },
      "colors": [0, 1, 2], "mix": "oklab" }              // "srgb" = bit-exact GOAT parity
  ],
  "fallback": { "mode": "auto" }                         // auto-generated, or hand-tuned CSS layers
}
```

- **Generator registry.** Each `type` maps to a generator with a typed param schema. The schema includes ranges, defaults, units and UI hints, so the Studio inspectors are generated from it rather than hand-built.
- **Layers.** A file is a stack of layers with `normal | screen | add | multiply | overlay` blending and per-layer masks (linear or radial fade). This is what lets one format hold GOAT auroras and anything else.
- **Colour.** Colours are stored as OKLCH strings, converted to OKLab on the CPU, mixed in OKLab in the shader, and gamut-mapped at output. The canvas uses `colorSpace: 'display-p3'` when the browser supports it. Björn Ottosson's matrices port directly from `OKLabColorPicker/OKLabColor.swift`.
- **Versioning.** `version` is an integer with forward migrations in `format/migrations`. Validation uses Valibot (about 1 kB) and reports errors with JSON paths.
- **Validation in tooling.** A JSON Schema is generated from the Valibot schema and published, so editors autocomplete `.aurora` files.

### 3.2 Runtime (`@goatsoft/aurora`)

- **WGSL composer.** At load time it assembles one shader per unique layer stack from the generator modules, then caches it by hash. The unplugin can do this at build time instead, so the browser never compiles strings it didn't need.
- **Worker pool.** This is ADR-0079 ported, with the same budgets: one device and one worker per page, leases, 30 fps shared budget, completion-gated frames, 0.5× DPR and the 1280 px cap. All of these become configurable through `configureAurora({ fps, maxPixels })`. Pipelines are cached per composed shader, and every surface still goes into one command encoder with one submit per tick.
- **Scenes.** This idea is kept from the current repo. Several surfaces can join a named scene and then share one document-space field and one clock, so separate panels read as one continuous aurora.
- **Fallback ladder.** Worker WebGPU first, then main-thread WebGPU (for Safari variants without worker GPU), then CSS. There is no WebGL step. The surface sets `data-aurora="webgpu|css"` truthfully, and only after the first frame has rendered.
- **CSS fallback compiler.** It turns layers into OKLab gradients (`radial-gradient(in oklab, …)`). With `motion.reduced` set appropriately, it can also produce a cheap compositor-only drift animation using `@property` and `transform`, never a repainting `filter: blur`.
- **Studio fidelity score.** The Studio reports a ΔE-OK fidelity score between the WebGPU render and its CSS fallback.
- **Lifecycle.** The runtime handles `device.lost`, `uncapturederror`, a 4 s probe timeout and AbortSignal-based disposal, as ADR-0077 requires.
- **Budgets enforced in CI.**
  - The core runtime stays under 10 kB gzip, with each generator under 2 kB.
  - Frame time is reported through `timestamp-query` when the browser supports it.
  - First frame lands within 100 ms of attach on an M1.

### 3.3 Integration surfaces

```vue
<!-- Vue -->
<AuroraBackground :src="hero" class="absolute inset-0" />
<script setup> import hero from '@/backgrounds/hero.aurora' </script>
```
```html
<!-- Any site -->
<aurora-bg src="/hero.aurora" scene="landing"></aurora-bg>
```
- **unplugin.**
  - Validates the file at build time and fails the build with a precise error.
  - Emits typed module output: the parsed doc, a precomposed WGSL string and the fallback CSS.
  - Inlines the CSS so it paints in the first frame with no flash.
  - HMR updates live canvases in place.
- **SSR-safe.** Server rendering emits the CSS fallback, and the client upgrades to WebGPU.

## 4. Aurora Studio (the builder)

**Stack.**
- Vue 3.5 and **vue-router 5**, using its built-in file-based routing (the former unplugin-vue-router, now `vue-router/vite`).
- `unplugin-auto-import`, `unplugin-vue-components` and `unplugin-icons` with Hugeicons (`.hg`, 2px stroke).
- shadcn-vue (reka-ui), Tailwind 4 and motion-v.

This matches the GOAT web stack, so components can move between projects.

**Layout.** The window is a full-bleed live canvas with floating glass panels:
- **Left: Layers.** Add, reorder, duplicate, solo and mute layers. Each layer gets a generator picker with live thumbnails.
- **Right: Inspector.**
  - Controls are generated from the param schema: scrubbable number fields, drag-to-adjust, and keyboard nudges with shift for ×10.
  - **OKLCH colour picker.** A Lab plane plus hue strip, with a gamut boundary overlay for sRGB and P3, harmonies and a WCAG contrast check against page text. The math is ported from OKLabColorPicker.
- **Bottom: Timeline / motion.** Speed, a seed shuffler, a reduced-motion preview and a scroll-parallax scrubber.
- **Top bar.** Viewport presets (hero, panel, tile, phone, and a full page with scroll), plus a light/dark page context. The dark context shows the Caprine Midnight look and the light one shows multiply.

**Slick details.**
- ⌘K command palette and full keyboard control.
- Undo/redo history.
- Autosave to IndexedDB.
- Shareable URLs: the document is compressed into the hash, with no server.
- Drag-and-drop a `.aurora` file to open it.

**Preview modes.**
- WebGPU, CSS fallback, or side by side with a split slider.
- A fidelity score between the two.
- A perf HUD showing GPU ms, fps and surface count.

**Export.**
- `.aurora` download.
- Copy-snippet for Vue, HTML custom element and plain CSS fallback.
- PNG poster frame for `og:image` and posters.

**Preset gallery.** It ships with the GOAT pack (the eight usages, named), the GOATsoft mono pack and starters for each generator type.

**Dev-tool mode.** Run `npx aurora studio` in a project, or use the unplugin's dev middleware. Studio then opens the project's `.aurora` files and saves edits straight back to disk, and HMR pushes them into the running site.

**Hosting.** The same build is deployed as a static app, where saving downloads the file instead of writing to disk.

## 5. Docs and marketing site

**`@goatsoft/docs-kit`** is our own pipeline, built on markdown-it 14, the same parser VitePress uses.
- Frontmatter comes from gray-matter.
- Shiki handles highlighting, with dual light/dark themes and `// [!code highlight]` notation.
- Plugins:
  - Anchors and TOC extraction.
  - Containers: `tip`, `warning`, `details`, `code-group`.
  - Wikilinks and the glossary, both ported from GOAT's in-repo plugins.
  - Mermaid, bundled with no CDN.
- **Live demos.** A ```` ```aurora ```` fence renders a live, editable background next to its source.
- A Vite plugin turns `docs/**/*.md` into route components, which vue-router 5 file routes pick up.
- Search is a build-time MiniSearch index.

**`GOATsoft/apps/aurora.goatsoft.io`** contains:
- Landing: a hero that is itself an Aurora scene spanning several sections, a gallery, "made with Aurora", and a "try it" link that deep-links into Studio.
- `/docs`: guide, format reference (generated from the schema), generator reference (generated from param schemas) and API reference.

The whole site is prerendered to static HTML with our own small SSG script using `vue/server-renderer`. That gives SEO, instant first paint and CSS fallback in the HTML. Targets are Lighthouse 100/100/100/100 and zero CLS.

**Hosting.** GitHub Pages at **`aurora.goatsoft.io`**, with no Cloudflare. The setup copies `apps/goatsoft.io`:
- A second job in the GOATsoft `pages.yml` builds `apps/aurora.goatsoft.io`.
- `peaceiris/actions-gh-pages` pushes the output to a publish-only repo, `goatsoft/aurora.goatsoft.io`, with `cname: aurora.goatsoft.io`.
- The Porkbun CNAME to `goatsoft.github.io` is already live.

One Pages site serves:
- `/` is the marketing site.
- `/docs` is the docs.
- `/studio` is Studio.
- `/schema/v1.json` is the format schema.

Every route is prerendered. A `404.html` copy of the SPA shell handles Studio's deep links. The deploy action writes `CNAME`. Studio's hosted build comes from the published `@goatsoft/aurora-studio` package.

## 6. Phases

| # | Phase | Deliverable | Done when |
|---|---|---|---|
| 0 | **Reset** | Legacy work moved to `~/Projects/aurora-legacy`, and the new repo is `goatsoft/aurora` with fresh history. Scaffold the pnpm workspace with Vite 8, TS, ESLint, Vitest 4 (unit and **browser mode on Chromium with real WebGPU**), Changesets and CI. | `pnpm verify` passes on an empty skeleton |
| 1 | **Format + colour** | `aurora-format`: schema, validation, migrations, OKLab/OKLCH/P3 maths, gamut mapping, JSON Schema emit | 100% unit coverage. Round-trip and fuzz tests pass. |
| 2 | **Runtime** | Composer, `aurora-fbm` generator, worker pool, scenes, CSS compiler | **GOAT parity:** all 8 GOAT usages render pixel-identical in `mix:"srgb"` (screenshot diff ≤ 1%). Lifecycle and fallback tests pass. Size budgets are met. |
| 3 | **Bindings** | `<aurora-bg>`, `aurora-vue`, `aurora-unplugin` with HMR | A sample app imports `.aurora`, there is no flash, and the SSR fallback works |
| 4 | **More generators** | mesh-gradient, waves, grain, conic, noise-field; layer blending and masks | Each generator has param schema, docs and a golden image |
| 5 | **Studio** | Builder as in section 4, hosted and local dev-tool mode | It can recreate every GOAT preset from scratch and export a file identical to the pack |
| 6 | **Docs + site** | In the GOATsoft monorepo: `packages/docs-kit`, `apps/aurora.goatsoft.io`, prerender, and a publish job to `goatsoft/aurora.goatsoft.io` | Lighthouse targets are met and all docs examples are live |
| 7 | **Rollout** | Replace the aurora in GOAT/web, the GOAT docs theme and goatsoft.io. Delete their shader copies and GLSL paths. Supersede GOAT ADR-0079 and GOATsoft ADR-0005 with Aurora ADRs. | Every GOATsoft site runs on `@goatsoft/aurora` |

Phase 2 is the critical path. Phases 4 and 5 can overlap once the generator API is stable after Phase 2.

## 7. Engineering bars ("really, really slick")

- **No visual glitches.**
  - No flash of an empty canvas.
  - No layout shift.
  - The fallback-to-WebGPU swap crossfades in about 300 ms.
  - Device loss recovers without the page noticing.
- **Accessibility.** Reduced motion is honoured everywhere. Backgrounds are always `aria-hidden`. Studio is fully keyboard-operable and passes WCAG AA.
- **Performance.** Paused off-screen and in hidden tabs, one GPU batch per tick, and budgets checked in CI.
- **Correct behaviour.** The runtime never claims WebGPU before a real frame has rendered, which matches the truthfulness rule from the earlier checkpoint.
- **ADRs in-repo** (`docs/adr/`) for format, colour space, runtime and fallback, written as decisions are made.

## 8. Decisions

1. **Domain:** `aurora.goatsoft.io`, served by GitHub Pages with a CNAME record at Porkbun.
2. **Packages:** `@goatsoft/*`, published to **GitHub Packages only** (`npm.pkg.github.com`) once the Phase 2 parity tests pass. Note that GitHub's npm registry needs a token with `read:packages` to install, even for public packages. Consuming sites need this `.npmrc`, plus `NODE_AUTH_TOKEN` in CI:
   ```
   @goatsoft:registry=https://npm.pkg.github.com
   ```
3. **Licence:** MIT.
4. **Package manager:** pnpm workspaces.
5. **Touch devices:** use WebGPU on touch devices when it is available, with an opt-out to force CSS.
6. **Repos:**
   - `goatsoft/aurora` holds the library and Studio.
   - The website and docs-kit live in the GOATsoft monorepo.
   - The Pages output goes to `goatsoft/aurora.goatsoft.io`.
   - The legacy checkpoint stays local only, in `~/Projects/aurora-legacy`.
