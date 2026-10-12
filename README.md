# Aurora

WebGPU animated backgrounds with a CSS fallback, from GOATsoft.

Design a background in **Aurora Studio**, export a `.aurora` file and drop it into any site. WebGPU renders it, and browsers without WebGPU get a generated CSS fallback. Colours are authored and blended in OKLab/OKLCH.

> Early development. See [PLAN.md](PLAN.md) for the roadmap. Packages publish to GitHub Packages under `@goatsoft`.

## Use

**Vue**, with the bundler plugin: files are validated at build time, the CSS fallback is server-rendered, and edits hot-reload in place.

```ts
// vite.config.ts
import aurora from '@goatsoft/aurora-unplugin/vite'
export default defineConfig({ plugins: [vue(), aurora()] })
```

```vue
<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import hero from './hero.aurora'
</script>

<template>
  <section class="relative">
    <AuroraBackground :src="hero" />
  </section>
</template>
```

Add `"@goatsoft/aurora-unplugin/client"` to `compilerOptions.types` for typed `.aurora` imports. Wrap panels in `<AuroraScene name="landing">` to make them one continuous background.

**Any page**, no framework:

```html
<script type="module" src="https://…/@goatsoft/aurora/element"></script>
<section style="position: relative">
  <aurora-bg src="/hero.aurora"></aurora-bg>
</section>
```

Style it with `aurora-bg:state(webgpu)` and `aurora-bg:state(css)`; listen for `aurora-mode` and `aurora-error`.

**Plain TypeScript**: `mountAurora(element, doc)` from `@goatsoft/aurora`.

Twelve generators ship built in: the flagship **aurora** and a **starfield** to set it against, the elements (**strata** and **mountains** for Earth, **clouds** and **wind** for Air, **fire**, **water**), animated gradients (**mesh-gradient**, **linear-sweep**, **conic**) and **grain**. See [docs/generators](docs/generators) for every parameter, [presets/starters](presets/starters) for a starter file each, and [presets/scenes](presets/scenes) for art-directed scenes such as northern lights over a starfield. Only `aurora-fbm` ships eagerly; the others load the first time a document uses them.

The classic presets in [`presets/classic`](presets/classic) is the place to start, and [`apps/sample`](apps/sample) shows all of it together.

| Package | What it is |
|---|---|
| `@goatsoft/aurora` | WebGPU runtime: worker pool, WGSL composer, scenes, CSS fallback. `/element` is `<aurora-bg>` |
| `@goatsoft/aurora-vue` | `<AuroraBackground>`, `useAurora()`, `<AuroraScene>` |
| `@goatsoft/aurora-unplugin` | `import hero from './hero.aurora'` for Vite, Rollup, Rolldown, esbuild, webpack, Rspack |
| `@goatsoft/aurora-format` | The `.aurora` format: schema, validation, migrations, JSON Schema |
| `@goatsoft/color` | OKLab/OKLCH, sRGB/P3, gamut mapping, ΔE-OK, CSS colour parsing |

## Aurora Studio

Studio is the builder: a live canvas with layers, an inspector generated from each generator's params, an OKLCH picker with gamut boundaries and contrast checks, side-by-side WebGPU and CSS previews with a fidelity score, presets, ⌘K for everything, undo, autosave and share links. Export a `.aurora` file, copy a Vue, HTML or CSS snippet, or save a poster PNG. Files stay on your machine: in Chromium browsers Studio opens a file or a whole folder and ⌘S saves in place; elsewhere it downloads.

In a Vite project with the unplugin, the dev server prints an **Aurora Studio** link: Studio opens your project's `.aurora` files and saves edits back to disk, and HMR updates the page. Without Vite, run `npx aurora studio` in the project.

## Development

Requires Node 24+ (see `.nvmrc`) and pnpm 10 (`corepack enable`).

```sh
pnpm install
pnpm exec playwright install chromium   # once, for browser tests
pnpm verify                             # lint, typecheck, unit + WebGPU browser tests, build
```

| Script | What it does |
|---|---|
| `pnpm test` | Unit tests (Node) |
| `pnpm test:browser` | Browser tests in headless Chromium with real WebGPU |
| `pnpm lint:fix` | Fix lint and formatting (ESLint Stylistic) |
| `pnpm coverage` | Unit tests with V8 coverage |
| `pnpm changeset` | Record a change for the next release |

Tooling decisions live in [docs/adr](docs/adr). Agent and contributor rules are in [AGENTS.md](AGENTS.md).

## Licence

Source code, documentation, presets and examples use the [MIT licence](LICENSE). Artwork and branding (the Aurora name, mark and everything in [`assets/`](assets)) have [separate terms](LICENSE-ART.md).
