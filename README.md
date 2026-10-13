<div align="center">

<a href="https://aurora.goatsoft.io">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/aurora-dark.svg">
    <img src="assets/brand/aurora-light.svg" width="112" height="112" alt="Aurora">
  </picture>
</a>

# Aurora

**Give your site atmosphere.** Beautiful backgrounds that move with you.

Animated WebGPU backgrounds with a CSS fallback in the first paint. Design one in Aurora Studio, then drop it into any site.

[![npm](https://img.shields.io/npm/v/%40goatsoft%2Faurora?label=npm&logo=npm&color=8c83ff)](https://www.npmjs.com/package/@goatsoft/aurora)
[![CI](https://img.shields.io/github/actions/workflow/status/goatsoft/aurora/ci.yml?branch=develop&label=CI&logo=github)](https://github.com/goatsoft/aurora/actions/workflows/ci.yml)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-43f4dc)](LICENSE)

[**Website**](https://aurora.goatsoft.io) · [**Docs**](https://aurora.goatsoft.io/docs) · [**Aurora Studio**](https://aurora.goatsoft.io/studio/) · [**npm**](https://www.npmjs.com/org/goatsoft) · [**GOATsoft**](https://goatsoft.io)

</div>

## Why Aurora

- **Design it, don't code it.** [Aurora Studio](https://aurora.goatsoft.io/studio/) is a full editor for backgrounds: layers, an OKLCH colour picker with gamut and contrast checks, live WebGPU and CSS previews side by side. It saves a small `.aurora` file you commit with your site.
- **Looks right from the first frame.** The CSS fallback is compiled from the same layers and server-rendered, so the page paints with its background before any JavaScript runs. WebGPU crossfades in once its first frame is ready, and browsers without WebGPU keep the fallback.
- **Light on the page.** Rendering runs in a worker where the browser allows it. The runtime is under 8 kB gzipped, and each generator is under 2 kB and loads only when a background uses it. Backgrounds pause off-screen and in hidden tabs, and honour reduced motion.
- **Every kind of atmosphere.** Auroras, curtains and starfields; linear, conic, sweep and mesh gradients; clouds, wind, rain and lightning; mountains, treelines and strata; water, fire and film grain. Layer them with blend modes and masks.
- **One background across sections.** Wrap panels in a shared scene and their backgrounds line up as one continuous sky.
- **A real build step.** The bundler plugin validates every `.aurora` file at build time, with errors at the exact line and column, gives you typed imports, and hot-reloads edits in place. It works with Vite, Rollup, Rolldown, esbuild, webpack and Rspack.
- **Colour done properly.** Colours are authored and blended in OKLab and OKLCH, with Display P3 output where the browser supports it.

## Quick start

```sh
npm install @goatsoft/aurora @goatsoft/aurora-vue
npm install -D @goatsoft/aurora-unplugin
```

Add the plugin to your bundler:

```ts
// vite.config.ts
import aurora from '@goatsoft/aurora-unplugin/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), aurora()],
})
```

Then save a background from [Studio](https://aurora.goatsoft.io/studio/) as `src/hero.aurora` and use it:

```vue
<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import hero from './hero.aurora'
</script>

<template>
  <section style="position: relative">
    <AuroraBackground :src="hero" />
    <h1>Your headline</h1>
  </section>
</template>
```

No framework? Use the custom element:

```html
<script type="module">
  import '@goatsoft/aurora/element'
</script>

<section style="position: relative">
  <aurora-bg src="/hero.aurora"></aurora-bg>
</section>
```

Or plain TypeScript: `mountAurora(element, hero)` from `@goatsoft/aurora`. The [getting started guide](https://aurora.goatsoft.io/docs/guide/getting-started) covers typed imports, Tailwind, other bundlers and server rendering.

## Packages

All packages are published to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements), built and signed by this repository's release workflow.

| Package | Version | What it is |
|---|---|---|
| [`@goatsoft/aurora`](https://www.npmjs.com/package/@goatsoft/aurora) | [![npm](https://img.shields.io/npm/v/%40goatsoft%2Faurora?label=)](https://www.npmjs.com/package/@goatsoft/aurora) | The runtime: WebGPU rendering, the CSS fallback, scenes, and the `<aurora-bg>` element |
| [`@goatsoft/aurora-vue`](https://www.npmjs.com/package/@goatsoft/aurora-vue) | [![npm](https://img.shields.io/npm/v/%40goatsoft%2Faurora-vue?label=)](https://www.npmjs.com/package/@goatsoft/aurora-vue) | Vue 3: `<AuroraBackground>`, `<AuroraScene>` and `useAurora()`, with server rendering |
| [`@goatsoft/aurora-unplugin`](https://www.npmjs.com/package/@goatsoft/aurora-unplugin) | [![npm](https://img.shields.io/npm/v/%40goatsoft%2Faurora-unplugin?label=)](https://www.npmjs.com/package/@goatsoft/aurora-unplugin) | `.aurora` imports for Vite, Rollup, Rolldown, esbuild, webpack and Rspack, plus `npx aurora studio` |
| [`@goatsoft/aurora-format`](https://www.npmjs.com/package/@goatsoft/aurora-format) | [![npm](https://img.shields.io/npm/v/%40goatsoft%2Faurora-format?label=)](https://www.npmjs.com/package/@goatsoft/aurora-format) | The `.aurora` format: schema, validation, migrations and JSON Schema |
| [`@goatsoft/color`](https://www.npmjs.com/package/@goatsoft/color) | [![npm](https://img.shields.io/npm/v/%40goatsoft%2Fcolor?label=)](https://www.npmjs.com/package/@goatsoft/color) | OKLab and OKLCH colour maths: sRGB and Display P3, gamut mapping, ΔE-OK, CSS colour parsing |

## Documentation

Everything lives at **[aurora.goatsoft.io/docs](https://aurora.goatsoft.io/docs)**.

| Guide | |
|---|---|
| [Getting started](https://aurora.goatsoft.io/docs/guide/getting-started) | Install, add the plugin and put a background on a page |
| [The .aurora format](https://aurora.goatsoft.io/docs/guide/format) | Every field of the file, with live examples |
| [The runtime](https://aurora.goatsoft.io/docs/guide/runtime) | How Aurora picks a renderer, what shows first, and tuning |
| [Shared backgrounds](https://aurora.goatsoft.io/docs/guide/shared-backgrounds) | One background across several sections |
| [Generators](https://aurora.goatsoft.io/docs/generators) | Every generator and its parameters |
| [Aurora Studio](https://aurora.goatsoft.io/docs/studio) | Layers, colours, previews, saving and shortcuts |
| [Attribution badges](https://aurora.goatsoft.io/docs/guide/attribution) | An optional "Made with Aurora" badge for your site |

## Aurora Studio

[Aurora Studio](https://aurora.goatsoft.io/studio/) runs in the browser, and your files stay on your machine. In Chromium browsers it opens a file or a whole folder and <kbd>⌘</kbd> <kbd>S</kbd> saves in place; elsewhere it downloads. Export a `.aurora` file, copy a Vue, HTML or CSS snippet, share a link, or save a poster PNG.

Working on a project? In a Vite project with the plugin, the dev server prints an **Aurora Studio** link that opens your project's `.aurora` files, saves edits straight back to disk, and hot-reloads the page. Without Vite, run `npx aurora studio`.

Start from a [scene](presets/scenes), a [starter](presets/starters) for each generator, or the [classic presets](presets/classic).

## Development

Requires Node 24 or later (see `.nvmrc`) and pnpm 10 (`corepack enable`).

```sh
pnpm install
pnpm exec playwright install chromium   # once, for the WebGPU browser tests
pnpm dev                                # the site on localhost:5180, with Studio at /studio/
pnpm verify                             # lint, typecheck, tests, build and size budgets
```

| Script | What it does |
|---|---|
| `pnpm test` | Unit tests |
| `pnpm test:browser` | Browser tests in headless Chromium with real WebGPU |
| `pnpm lint:fix` | Fix lint and formatting |
| `pnpm changeset` | Record a change for the next release |
| `pnpm consumers` | Pack the packages and build a fresh project with them in every supported bundler |

Read [AGENTS.md](AGENTS.md) before contributing: it has the stack, the rules and how releases work. Design decisions are recorded in [docs/adr](docs/adr). Bugs and ideas go in [Issues](https://github.com/goatsoft/aurora/issues), and every version's notes are in [Releases](https://github.com/goatsoft/aurora/releases).

## Licence

Source code, documentation, presets and examples are [MIT](LICENSE). The Aurora name, mark and everything in [`assets/`](assets) are covered by the [artwork and brand licence](LICENSE-ART.md), which allows the official attribution badges.

<div align="center">
<br>

<a href="https://goatsoft.io">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/goatsoft-masthead-dark.svg">
    <img src="assets/brand/goatsoft-masthead.svg" width="56" height="56" alt="GOATsoft">
  </picture>
</a>

Made by **[GOATsoft](https://goatsoft.io)**

</div>
