---
title: Attribution badges
description: An optional finishing touch for sites made with Aurora.
order: 8
---

# Made with Aurora

Attribution is optional. If Aurora lights up your site, add a small badge to its footer, credits or documentation.

Each badge is a single, self-contained SVG: no JavaScript, external fonts, tracking or GPU work. The approved compact mark stays unchanged. Choose **Made with Aurora** (the default), **Powered by Aurora**, or **Aurora enabled**. These describe use of Aurora, not the renderer's current status.

## Choose your badge

Choose a layout, theme and glow, then copy a snippet for any label or download its SVG. The preview uses the local site; copied image URLs use the public Aurora site. Auto follows your colour scheme. Animated glow stays still when reduced motion is enabled.

<BadgeExamples />

## Vue

```vue
<script setup lang="ts">
import { AuroraBadge } from '@goatsoft/aurora-vue/badge'
</script>

<template>
  <AuroraBadge />
  <!-- Keep the original, taller card. -->
  <AuroraBadge layout="stacked" />
  <!-- Explicit theme, different label and optional flowing edge glow. -->
  <AuroraBadge label="powered-by" theme="dark" animated />
</template>
```

The component renders a normal link containing an image, with an accessible label and explicit dimensions: inline badges are 32 px tall (148 px wide for Made with, 160 for Powered by, 140 for enabled); stacked cards remain 168 × 48. It works with SSR and needs no stylesheet or Tailwind installation. Classes and link attributes pass through to the anchor. Keep the browser's focus outline, or provide your own visible focus treatment.

## Any framework

```ts
import { auroraBadge } from '@goatsoft/aurora/badge'

const { href, ...image } = auroraBadge({ theme: 'dark', animated: true })
// Render <a href={href}><img {...image} /></a> with your framework.
```

The helper is a separate, dependency-free entry point. Importing it does not load Aurora's renderer or request the image; the browser requests the SVG when you render it.

## Plain HTML or Markdown

```html
<a href="https://aurora.goatsoft.io/">
  <img
    src="https://aurora.goatsoft.io/badges/v1/made-with-inline-auto.svg"
    alt="Made with Aurora"
    width="148"
    height="32"
  >
</a>
```

```md
[![Made with Aurora](https://aurora.goatsoft.io/badges/v1/made-with-inline-auto.svg)](https://aurora.goatsoft.io/)
```

Wrap the image in a link: SVG-in-image links themselves are non-interactive. See [MDN's SVG linking guide](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/Linking).

## Options

| Option | Values | Default |
| --- | --- | --- |
| `label` | `made-with`, `powered-by`, `enabled` | `made-with` |
| `layout` | `inline`, `stacked` | `inline` |
| `theme` | `auto`, `light`, `dark` | `auto` |
| `animated` | `true`, `false` | `false` |
| `baseUrl` | URL or path of your badge directory | `https://aurora.goatsoft.io/badges/v1` |

Inline files are named `{label}-inline-{theme}.svg` and `{label}-inline-{theme}-animated.svg`. Stacked files retain `{label}-{theme}.svg` and `{label}-{theme}-animated.svg`. All 36 combinations are generated from one template during development and builds. Generated SVGs are build output and are not committed.

Use `light` or `dark` to match a specific surface. `auto` follows `prefers-color-scheme`; an embedding element's CSS `color-scheme` can supply the page's manually selected theme. See [MDN's embedded SVG colour-scheme example](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme#inherited_color_scheme_in_embedded_elements).

Animation is a pair of luminous colour trails moving around the edge, with a soft breathing halo; the mark and text do not move. The animated files remain still unless `prefers-reduced-motion: no-preference` matches. Choose the static files for README badges, email or platforms that sanitise SVG styles. The badge remains readable if a viewer ignores its animation.

## Self-hosting and licence

Use **Download SVG** above to save the chosen official badge into your site's public directory, keep it unmodified, then point the component or helper to that directory:

```vue
<AuroraBadge base-url="/brand/badges" theme="light" />
```

This loads `/brand/badges/made-with-inline-light.svg`. Serve SVGs as `image/svg+xml`. Self-hosting avoids an external image request; otherwise your `img-src` policy must allow `https://aurora.goatsoft.io`.

The helper and Vue component are MIT code. The artwork stays under the [Aurora artwork and brand licence](https://github.com/goatsoft/aurora/blob/develop/LICENSE-ART.md), which explicitly permits embedding and self-hosting these unmodified attribution badges. They are not a certification or an endorsement.

The hosted URLs are deployed with the Aurora site. When developing this feature before that deployment, use a self-hosted badge directory or the local site's `/badges/v1/` route.

## Building the badges

Contributors edit `assets/brand/badges/badge.svg` and its variant settings in `generate.ts`. The generator embeds the approved favicon artwork without changing its paths. Site development/builds generate the ignored `assets/brand/badges/v1/` directory automatically; the site publishes it at `/badges/v1/`.

To generate the files without building the apps:

```sh
pnpm badges:generate
```
