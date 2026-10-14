---
"@goatsoft/aurora": minor
"@goatsoft/aurora-format": minor
---

Add optional scene-wide signal distortion with coherent tearing, stretch, shake, vertical tracking slips and colour separation. Preserve existing rendering when omitted, expose declarative controls and validation, and apply the effect to Signal Lost. Studio can edit, save and share the effect with undo support.

Add independent Pixelate and Vignette modifiers, with resolution-aware display blocks and alpha-preserving edge shading. Studio groups all three under Modifiers, separately from generators.

Disable signal distortion under reduced motion and skip extra colour samples between visible bursts. Export a shared modifier control spec for Studio and generated validation/reference docs; keep Pixelate units explicit as canvas pixels.

Keep complete Studio and editor descriptions while deriving lean runtime validators from the authoring schemas. Generate string literals safely with apostrophe, backslash and Unicode handling.
