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

Studio and the site import these files from here (`~/assets/brand/…`); don't copy them into packages, which are published under MIT.

## Licence

The Aurora mark and every file in `assets/` are Brand Assets under the [Aurora artwork and brand licence](../../LICENSE-ART.md), not the MIT licence that covers the code.

## Attribution badges

`badges/badge.svg` is the shared template. `badges/generate.ts` combines it with the approved favicon artwork to generate single-file inline (32 px tall, the default) and stacked (168 × 48) SVGs for `made-with`, `powered-by` and `enabled`, each in `auto`, `light` and `dark`, with a static default and an optional `-animated` suffix. Embed as a linked image; the compact mark is reproduced unchanged at 20 px inline or 32 px stacked. The slow animation affects only the card's inset glow and honours reduced motion.

Use the attribution docs page for live examples, downloads and copyable Vue/HTML/Markdown snippets. Generated files in `badges/v1/` are ignored by Git; site and Studio configs generate them automatically, or run `pnpm badges:generate`. Inline URLs are `/badges/v1/{label}-inline-{theme}[-animated].svg`; stacked cards retain `/badges/v1/{label}-{theme}[-animated].svg`; the site's Vite plugin serves generated SVGs in development and emits them at those stable paths for production. The package helpers reference these URLs and contain no artwork. See `docs/guide/attribution.md` for HTML, Markdown, Vue and self-hosting examples.

The complete, unmodified badges may be used for attribution under the specific permission in LICENSE-ART.md. This does not change the licence of the mark or the rest of the artwork.
