---
title: Getting started
description: Install Aurora and put a background on a page, with Vue or without a framework.
order: 1
---

# Getting started

## Before you install

Aurora's packages are on GitHub Packages under the `@goatsoft` scope, and GitHub Packages needs a token even for public packages.

1. On GitHub, create a personal access token (classic) with the `read:packages` scope.
2. Add it to your user `~/.npmrc` (not the project's, so it isn't committed):

   ```ini [~/.npmrc]
   //npm.pkg.github.com/:_authToken=YOUR_TOKEN
   ```

3. Point the scope at GitHub Packages in your project's `.npmrc`:

   ```ini [.npmrc]
   @goatsoft:registry=https://npm.pkg.github.com
   ```

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

::: tip One background across panels
Wrap separate sections in `<AuroraScene name="landing">` and their backgrounds share their timing and position, so they line up as one background. See [Shared backgrounds](shared-backgrounds.md).
:::

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
