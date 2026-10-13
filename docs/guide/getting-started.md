---
title: Getting started
description: Install Aurora and put a background on a page, with Vue or without a framework.
order: 1
---

# Getting started

## The packages

Aurora is published on [npm](https://www.npmjs.com/org/goatsoft) under the `@goatsoft` scope, with [provenance](https://docs.npmjs.com/generating-provenance-statements): each release is built and signed by the repository's release workflow on GitHub. Most sites need the first three.

| Package | What it is |
|---|---|
| [`@goatsoft/aurora`](https://www.npmjs.com/package/@goatsoft/aurora) | The runtime: WebGPU rendering, the CSS fallback and the `<aurora-bg>` element |
| [`@goatsoft/aurora-vue`](https://www.npmjs.com/package/@goatsoft/aurora-vue) | Vue 3 components: `<AuroraBackground>`, `<AuroraScene>` and `useAurora()` |
| [`@goatsoft/aurora-unplugin`](https://www.npmjs.com/package/@goatsoft/aurora-unplugin) | Imports `.aurora` files in Vite, Rollup, Rolldown, esbuild, webpack and Rspack |
| [`@goatsoft/aurora-format`](https://www.npmjs.com/package/@goatsoft/aurora-format) | The `.aurora` format: schema, validation and migrations |
| [`@goatsoft/color`](https://www.npmjs.com/package/@goatsoft/color) | OKLab and OKLCH colour maths |

## Your first file

Open [Aurora Studio](/studio/), pick a scene, and save it into your project as `src/hero.aurora`. Or copy one of the [starters](../../presets/starters/aurora-fbm.aurora), one for each generator. The examples below import that file.

## With Vue and Vite

Install the runtime, the Vue binding and the bundler plugin:

::: code-group

```sh [pnpm]
pnpm add @goatsoft/aurora @goatsoft/aurora-vue
pnpm add -D @goatsoft/aurora-unplugin
```

```sh [npm]
npm install @goatsoft/aurora @goatsoft/aurora-vue
npm install -D @goatsoft/aurora-unplugin
```

:::

Add the plugin. It validates every `.aurora` import at build time (errors point at the file, line and column), inlines the CSS fallback, and hot-reloads edits in place:

```ts [vite.config.ts]
import aurora from '@goatsoft/aurora-unplugin/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), aurora()], // [!code highlight]
})
```

For typed imports, add the client types to your `tsconfig.json`:

```json [tsconfig.json]
{
  "compilerOptions": {
    "types": ["@goatsoft/aurora-unplugin/client"]
  }
}
```

Then import the file. The background fills its nearest positioned parent, so give that element `position: relative` (or `absolute` or `fixed`):

```vue [Hero.vue]
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

On the server, `<AuroraBackground>` renders the CSS fallback, so the first paint already has the background. In the browser, WebGPU replaces it once its first frame is ready, with a short crossfade.

::: tip Using Tailwind
The examples use inline styles so they work anywhere. With Tailwind, use classes instead:

| Inline style | Tailwind |
|---|---|
| `position: relative` | `relative` |
| `position: fixed; inset: 0; z-index: -1; pointer-events: none` (a full-page background) | `fixed inset-0 -z-1 pointer-events-none` |
| `position: relative; overflow: hidden` (a card) | `relative overflow-hidden` |

The background sizes itself to that element, so it needs no classes of its own. Studio's **Export** menu can also give you its snippets with Tailwind classes.
:::

::: tip One background across panels
Wrap separate sections in `<AuroraScene name="landing">` and their backgrounds share their timing and position, so they line up as one background. See [Shared backgrounds](shared-backgrounds.md).
:::

## Other bundlers

The plugin works the same way in Rollup, Rolldown, esbuild, webpack and Rspack. Import it from `@goatsoft/aurora-unplugin/rollup`, `/rolldown`, `/esbuild`, `/webpack` or `/rspack`:

```js [webpack.config.js]
import aurora from '@goatsoft/aurora-unplugin/webpack'

export default {
  plugins: [aurora()],
}
```

Aurora renders in a worker, which it loads with `new URL(…, import.meta.url)`. Vite, webpack and Rspack copy that file into your build automatically. Rollup, Rolldown and esbuild don't, so there Aurora renders WebGPU on the main thread instead: it still works, but frames share the main thread with your page. To keep it in a worker, copy `node_modules/@goatsoft/aurora/dist/assets/` to an `assets/` folder next to your built JavaScript files, or use a plugin that handles `import.meta.url` assets.

## Without a framework

The custom element works with any framework, or none. This example imports the package by name, so the page needs a bundler such as Vite, or an import map that points `@goatsoft/aurora/element` at the package's file:

```html [index.html]
<script type="module">
  import '@goatsoft/aurora/element'
</script>

<section style="position: relative">
  <aurora-bg src="/hero.aurora"></aurora-bg>
</section>
```

`src` is a URL, so the file has to be served with the page: in Vite, put it in `public/`. The element fetches it after the script runs, so the background appears once the file has loaded; until then the section shows its own background colour. For a background in the first paint, render the Vue component on the server or pre-render the page.

Style it per mode with `aurora-bg:state(webgpu)` and `aurora-bg:state(css)`, and listen for the `aurora-mode` and `aurora-error` events.

## Plain TypeScript

```ts
import { mountAurora } from '@goatsoft/aurora'
import hero from './hero.aurora'

const surface = mountAurora(document.querySelector('#hero')!, hero)
// Later: surface.update(other), or surface.dispose().
```
