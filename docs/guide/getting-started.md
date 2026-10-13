---
title: Getting started
description: Install Aurora and put a background on a page, with Vue or without a framework.
order: 1
---

# Getting started

Aurora's packages publish to GitHub Packages under the `@goatsoft` scope. Point the scope at it once, in your project's `.npmrc`:

```ini [.npmrc]
@goatsoft:registry=https://npm.pkg.github.com
```

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

Then import a file and give it a positioned parent. The background fills it:

```vue [Hero.vue]
<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import hero from './hero.aurora'
</script>

<template>
  <section class="relative">
    <AuroraBackground :src="hero" />
    <h1>Your headline</h1>
  </section>
</template>
```

On the server, `<AuroraBackground>` renders the CSS fallback, so the first paint already has the background. In the browser, WebGPU takes over without a flash once its first frame is ready.

::: tip One background across panels
Wrap separate sections in `<AuroraScene name="landing">` and their backgrounds share one clock and one continuous field, so they read as a single sky.
:::

## Any page, no framework

The custom element works anywhere, including plain HTML:

```html [index.html]
<script type="module">
  import '@goatsoft/aurora/element'
</script>

<section style="position: relative">
  <aurora-bg src="/hero.aurora"></aurora-bg>
</section>
```

Style it per mode with `aurora-bg:state(webgpu)` and `aurora-bg:state(css)`, and listen for the `aurora-mode` and `aurora-error` events.

## Plain TypeScript

```ts
import { mountAurora } from '@goatsoft/aurora'
import hero from './hero.aurora'

const surface = mountAurora(document.querySelector('#hero')!, hero)
// Later: surface.update(other), or surface.dispose().
```

## Your first file

Open [Aurora Studio](/studio/), pick a scene, and save. Or start from a starter in [`presets/starters`](../../presets/starters/aurora-fbm.aurora), one for each generator.
