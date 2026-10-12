# Aurora logo

A neon-tube A built from an upward-facing terminal chevron and a detached underscore. The cyan–violet–orchid spectrum connects the developer tooling to Aurora's animated light and colour. The rounded apex and caps echo the supplied neon reference.

## Assets

| File | Use |
| --- | --- |
| `aurora-auto.svg` | Transparent mark, 48 px and larger; follows `prefers-color-scheme` |
| `aurora-dark.svg` | Explicit version for dark backgrounds |
| `aurora-light.svg` | Explicit version for light backgrounds, with deeper colours |
| `favicon-auto.svg` | Adaptive favicon and compact UI mark; heavier strokes, larger silhouette, no blur or highlight |
| `favicon-dark.svg` / `favicon-light.svg` | Explicit compact variants for application themes |
| `aurora-mono.svg` | Single-colour mark; inherits `currentColor` when inlined |
| `preview.html` | Local comparison and SVG download links |
| `preview.svg` / `preview.png` | Presentation sheet, including actual 16, 24, 32 and 48 px samples |

All production marks have a square 128-unit viewBox, transparent backgrounds, no fonts, no scripts and no external resources. The word “aurora” and tagline on the presentation sheet are illustrative typography, not part of the exported mark. The mark is static and introduces no motion.

## Usage

Copy the required SVGs into the consuming site's public assets directory:

```html
<link rel="icon" type="image/svg+xml" href="/brand/favicon-auto.svg">
<img src="/brand/aurora-auto.svg" width="64" height="64" alt="Aurora">
```

The adaptive files follow the colour scheme supplied by the browser. For a manual application theme, select the explicit light or dark asset according to its background, or set the enclosing element's CSS `color-scheme` when embedding the adaptive SVG as an image. A favicon follows browser preferences independently of the page's theme toggle.

Use the compact variant below 48 px. Use the neon variant for larger placements. Preserve the viewBox padding so the glow is not cropped. If inlining more than one gradient mark into a document, give each copy unique gradient and filter IDs and update its `url(#…)` references. External `<img>` embeds isolate these IDs automatically. For a monochrome external image, replace `currentColor` with a fixed colour; parent text colour only inherits into inline SVG.

These are standalone design assets; no application branding has been replaced.
