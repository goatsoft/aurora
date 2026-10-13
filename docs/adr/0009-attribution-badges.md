# ADR-0009: Optional attribution as standalone SVGs

Status: accepted

## Context

Aurora needs a small, polished attribution badge that works in HTML, Markdown and Vue. The brand artwork is separately licensed and must not be copied into MIT-published packages. A badge must not imply that a WebGPU frame has rendered, and adding attribution must not pull in the runtime.

## Decision

Keep one SVG template and variant generator in `assets/brand/badges/`, embedding the approved favicon artwork unchanged. Generate all 36 complete SVGs into the ignored `assets/brand/badges/v1/` directory during app development/builds and test setup; generated variants are not committed. The attribution docs provide interactive previews, downloads and copyable snippets instead of a separate preview HTML file. Default to a compact, single-line layout (32 px tall); preserve the original 168 × 48 cards through `layout: 'stacked'` and their existing URLs. Provide three labels and light, dark and adaptive themes. Static is the default; animated variants apply a pair of luminous edge trails and a soft breathing halo, gated by the reduced-motion media query. Keep text as SVG text using local Inter with Arial/Helvetica/sans-serif fallbacks; there are no remote fonts or scripts.

Serve versioned, stable URLs from the site in development and production. Expose a pure image/link descriptor at `@goatsoft/aurora/badge` and an SSR-safe linked-image component at `@goatsoft/aurora-vue/badge`. Both allow a self-hosted base URL and contain no mark artwork. Do not add either entry point to the main runtime exports.

Permit unmodified official badges to be embedded and self-hosted for attribution through a narrow exception in LICENSE-ART.md. Attribution remains optional.

## Consequences

A badge is one cached image request and works without hydration. Dimensions reserve its layout space. Consumers can avoid the external request by self-hosting. The SVG theme follows the embedding colour scheme unless an explicit variant is chosen. The site must deploy the v1 assets before packages depending on the default hosted URLs are released. Typography can vary with locally available fonts; wider Linux fallbacks leave less room in the inline Powered by Aurora badge. Converting the text to outlines is a possible future improvement for exact rendering. The vector mark and layout stay fixed.
