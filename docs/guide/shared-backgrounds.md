---
title: Shared backgrounds
description: One background behind a whole page, or one background across separate panels, and keeping them in sync.
order: 5
---

# Shared backgrounds

There are two ways to make several parts of a page look like one background:

- **One background behind the whole page.** A single background pinned to the viewport, with your content scrolling over it. This is what goatsoft.io does.
- **One scene across separate panels.** Several backgrounds, each in its own card or section, that share their timing and position, so they line up as one picture.

## One background behind the page

Set `canvas.fixed` in the file. The background is pinned to the viewport instead of scrolling with its element, so mount it once, in your layout:

```json
{
  "$schema": "https://aurora.goatsoft.io/schema/v1.json",
  "format": "aurora",
  "version": 1,
  "name": "Page glow",
  "canvas": { "fixed": true, "parallax": 0.22 },
  "palette": ["oklch(0.68 0.16 245)", "oklch(0.56 0.22 285)", "oklch(0.58 0.25 310)"],
  "layers": [{ "type": "aurora-fbm", "params": { "intensity": 0.16, "scale": 1, "speed": 0.04 } }]
}
```

```vue
<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import glow from './page-glow.aurora'
</script>

<template>
  <!-- Behind everything, and never in the way of clicks. -->
  <div style="position: fixed; inset: 0; z-index: -1; pointer-events: none">
    <AuroraBackground :src="glow" />
  </div>
  <RouterView />
</template>
```

`parallax` sets how much the background moves as the page scrolls: `0` moves with the page and `1` stays still. Today only the `aurora-fbm` generator reads the scroll position, so parallax moves aurora layers and leaves the others where they are.

Because the background lives in the layout, it keeps running across route changes in a single-page app instead of restarting on every page.

## One scene across panels

Give several backgrounds the same scene name. Each one draws its own part of a single, larger picture:

```vue
<script setup lang="ts">
import { AuroraBackground, AuroraScene } from '@goatsoft/aurora-vue'
import sky from './northern-lights.aurora'

const plans = [{ name: 'Starter' }, { name: 'Pro' }, { name: 'Team' }]
</script>

<template>
  <AuroraScene name="pricing">
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem">
      <article v-for="plan in plans" :key="plan.name" style="position: relative; overflow: hidden">
        <AuroraBackground :src="sky" />
        <h3>{{ plan.name }}</h3>
      </article>
    </div>
  </AuroraScene>
</template>
```

Without a wrapper, pass the name directly: `<AuroraBackground :src="sky" scene="pricing" />`.

The custom element takes a `scene` attribute:

```html
<section class="card" style="position: relative"><aurora-bg src="/sky.aurora" scene="pricing"></aurora-bg></section>
<section class="card" style="position: relative"><aurora-bg src="/sky.aurora" scene="pricing"></aurora-bg></section>
```

And in plain TypeScript, the `scene` option:

```ts
import { mountAurora } from '@goatsoft/aurora'
import sky from './sky.aurora'

for (const card of document.querySelectorAll<HTMLElement>('.card')) {
  mountAurora(card, sky, { scene: 'pricing' })
}
```

### What a scene shares

- **A clock.** Every member's time counts from the moment the first member joined, so motion stays in step. A member that joins later picks up mid-animation instead of starting from zero.
- **A coordinate space.** The scene covers the smallest rectangle around all its members, in page coordinates. Each member draws only its own part of that rectangle, so a ribbon that leaves one card carries on in the next, and the gaps between cards hide part of the picture.
- **Updates when the layout changes.** When a member joins, leaves or resizes, every member recomputes its part, so the picture stays continuous.

Members don't have to use the same file. Give a panel behind body text the same file with a lower `intensity`, and it still lines up with its neighbours.

A scene lasts as long as it has members. When the last one is removed (on a route change, say), the scene ends, and the next one starts a new clock. Scenes are per page: two tabs, or two pages, don't share one.

## Keeping backgrounds in sync with your app

Change the document and the background follows. A change to values, such as colours, parameters or opacity, updates the running shader in place, without a flash. A change to the layer stack compiles a new shader in the background and swaps it in when it's ready.

```vue
<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { computed, ref } from 'vue'
// A file whose layers include `aurora-fbm`, the generator with an `intensity` parameter.
import hero from './hero.aurora'

const hovered = ref(false)
// The same file, brighter while the pointer is over the card. Only aurora layers change.
const doc = computed(() => ({
  ...hero.doc,
  layers: hero.doc.layers.map((layer) => layer.type === 'aurora-fbm'
    ? { ...layer, params: { ...layer.params, intensity: hovered.value ? 1.2 : 0.8 } }
    : layer),
}))
</script>

<template>
  <div style="position: relative" @pointerenter="hovered = true" @pointerleave="hovered = false">
    <AuroraBackground :src="doc" />
  </div>
</template>
```

Outside Vue, call `update` on the surface that `mountAurora` returned:

```ts
import { mountAurora } from '@goatsoft/aurora'
import hero from './hero.aurora'
import heroLight from './hero-light.aurora'

const light = matchMedia('(prefers-color-scheme: light)')
const pick = () => (light.matches ? heroLight : hero)

// Start with the current theme, then follow changes.
const surface = mountAurora(document.querySelector('#hero')!, pick())
light.addEventListener('change', () => surface.update(pick()))
```

A surface keeps its place in its scene through updates, so a theme switch in one panel doesn't restart the clock or break the picture across the others.
