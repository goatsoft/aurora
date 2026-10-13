# ADR-0009: Optional attribution as standalone SVGs

Status: accepted

## Context

Aurora needs a small, polished attribution badge that works in HTML, Markdown and Vue. The brand artwork is separately licensed and must not be copied into MIT-published packages. A badge must not imply that a WebGPU frame has rendered, and adding attribution must not pull in the runtime.

## Decision

Keep complete SVG badges in `assets/brand/badges/v1/`, reproducing the approved compact mark unchanged. Default to a compact, single-line layout (32 px tall); preserve the original 168 × 48 cards through `layout: 'stacked'` and their existing URLs. Provide three labels and light, dark and adaptive themes. Static is the default; animated variants apply a slow opacity pulse only to the card's glow, gated by the reduced-motion media query. Keep text as SVG text using local Arial/Helvetica/sans-serif fallbacks; there are no remote fonts or scripts.

Serve versioned, stable URLs from the site in development and production. Expose a pure image/link descriptor at `@goatsoft/aurora/badge` and an SSR-safe linked-image component at `@goatsoft/aurora-vue/badge`. Both allow a self-hosted base URL and contain no mark artwork. Do not add either entry point to the main runtime exports.

Permit unmodified official badges to be embedded and self-hosted for attribution through a narrow exception in LICENSE-ART.md. Attribution remains optional.

## Consequences

A badge is one cached image request and works without hydration. Dimensions reserve its layout space. Consumers can avoid the external request by self-hosting. The SVG theme follows the embedding colour scheme unless an explicit variant is chosen. The site must deploy the v1 assets before packages depending on the default hosted URLs are released. Typography can vary slightly with locally available fonts; the vector mark and layout stay fixed.
