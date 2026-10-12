# ADR-0003: Colour in OKLab, in one shared package

Status: accepted · 12 October 2026

## Context

Aurora's look depends on smooth, vivid gradients. Mixing in sRGB gives muddy midpoints and hue shifts; naive clipping of wide-gamut colours shifts hue too. GOATsoft projects (this repo, Studio's picker, the GOAT sites, OKLabColorPicker) kept reimplementing the same maths.

## Decision

- **`@goatsoft/color`**: one zero-dependency, strict-TypeScript package for OKLab/OKLCH, sRGB and Display P3, ΔE-OK, gamut mapping and CSS colour parsing. Nothing else in GOATsoft reimplements it. We chose it over culori (types are third-party) and colorjs.io (heavier, pre-1.0, more than we need) because it stays tiny for the runtime budget and does exactly what Studio and the shaders need.
- **Ottosson's forward matrices; derived inverses.** The published inverse matrices are rounded and round-trip with ~3e-8 error. Inverting the forward matrices at load makes sRGB → OKLab → sRGB exact to floating-point precision, which keeps `mix: "srgb"` GOAT parity bit-exact.
- **Gamut mapping per CSS Color 4 §13.2**: reduce OKLCH chroma at constant lightness and hue until the clipped colour is within one JND (ΔE-OK 0.02). Vivid colours stay vivid instead of clipping to a different hue.
- **Files store OKLCH strings.** `oklch()`, `oklab()`, `color(srgb|display-p3 …)` and hex are accepted (CSS Color 4 modern syntax, optional `/ alpha`); `formatOklch` writes the canonical form. Parse errors say exactly which value is wrong.

## Consequences

- The runtime converts palette colours on the CPU once and mixes in OKLab in the shader, gamut-mapping at output to sRGB or Display P3 depending on the canvas.
- The package must stay at 100% test coverage, with property-based round-trip tests for every conversion.
