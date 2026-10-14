# ADR-0011: Scene modifiers

Status: Accepted

## Context

The Tech generators draw their own signals. A broken-display effect must also stretch, tear and shake the existing composition, including landscapes and auroras. Adding another overlay generator cannot do that.

## Decision

Add optional `modifiers.signal` settings to the version 1 format. Its presence enables scene-wide signal distortion. The controls are amount, shake, tear size, colour separation, vertical tracking, burst frequency and seed. An omitted effect leaves both the document defaults and the existing shader path unchanged. Studio exposes it under Modifiers, with normal history and serialization.

For an affected document, the composer emits the complete layer stack as a callable WGSL function. Scene-space coordinates are warped before evaluating that function. This keeps all layers coherent and uses the scene's shared coordinates for separate surfaces. Masks follow their sampled content; the outer canvas fade stays attached to the surface. Coordinates at the scene boundary clamp to the edge.

Colour separation evaluates the stack at three horizontal offsets and combines channels in the output colour space, preserving premultiplied coverage. Without separation, only one sample is needed. This is one render pass with no intermediate textures, but separation can triple generator work, so it is opt-in. Numeric controls remain uniforms; only the effect's presence changes the shader key. The worker uses the same composer and the settings travel with the document.

Distortion uses the existing motion clock. Global speed zero and reduced-motion still freeze it; frequency zero freezes only the distortion. The CSS fallback remains the undistorted composition. Broad temporal bursts avoid deliberate whole-screen luminance flashing, and tearing boundaries soften over a pixel.

## Consequences

- Existing documents, CSS fallbacks and unmodified GPU goldens remain unchanged.
- New documents with modifiers need a runtime and format package that support this additive field. Older strict validators reject it.
- Signal Lost demonstrates the effect over glitch, static, phosphor and scan lines.
- This is a bounded scene modifier, not an arbitrary shader plug-in or a per-layer filter stack. Other modifiers need their own controls and cost review.

## Additional modifiers

`modifiers.pixelate` quantizes scene-space sample coordinates to a grid in canvas pixels. Generators receive the effective lower resolution so their own pixel-footprint filtering still works. A size of one bypasses quantization. `modifiers.vignette` darkens the composite in linear light using the existing colour library, preserving alpha; it has amount, clear radius and softness controls. A zero amount bypasses its colour conversion.

The fixed order is Signal distortion, Pixelate sampling, then Vignette and the outer canvas fade. All three are independent toggles in Studio's Modifiers section. Only signal colour separation needs additional scene samples; the others use the same single-pass composition. Modifier coordinates use the full scene, keeping shared panels consistent. CSS keeps the original undistorted, unshaded composition.
