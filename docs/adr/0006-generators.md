# ADR-0006: Generators, the noise library and loading

Status: accepted · 12 October 2026

## Context

Phase 4 adds ten generators to the aurora: animated gradients, grain, a `starfield` to sit under it, and the elements: Earth, Air, Fire and Water. They must look beautiful untouched, stay small, and work identically in the worker and on the main thread, including generators apps register themselves.

## Decision

- **A shared WGSL noise library** (`generators/noise.ts`): PCG integer hash (the top 24 bits, so results are exact in f32 and never round up to 1), value, Perlin, simplex, Worley, fbm / ridged / turbulence and curl, every symbol `noise_*`. Generators declare `requires`; the composer includes each module and its dependencies once per shader. Integer hashing instead of `fract(sin(…))` keeps patterns identical across GPUs and free of banding at large coordinates. GPU tests pin ranges, centring, F1 ≤ F2, curl divergence and determinism.
- **Generator specs are data.** A generator is its params, colours, palette, `requires` and WGSL, plus a CSS function. `GeneratorSpec` is everything but the CSS function, so it can be posted. The page sends the worker the spec of each generator a document uses, once per worker. The worker bundles no generator code (8.4 kB), and `registerGenerator()` works with the worker (it silently didn't before).
- **Built-ins load on demand.** `aurora-fbm` ships eagerly; the other ten are separate chunks loaded the first time a document uses them (`loadGenerators()`). `validateDocument()` is async and loads what it checks; `mountAurora` paints the fallback at once, loads, then repaints and starts the GPU path; an unknown generator settles on CSS. Main-thread entry: 7.0 kB.
- **Art direction is part of done.** Every generator has a palette that shows it at its best and defaults tuned on contact sheets of several frames, and a golden image under `packages/core/test/golden`. The Earth generator started as a shaded heightfield (`terrain`), which read as camouflage at background scale; it became `strata`, folded sandstone layers. `water`'s caustics are original (the well-known Shadertoy caustics are CC BY-NC-SA, incompatible with MIT). Air is `clouds` (two depths of fbm cloud lit by a short march towards the sun, so bellies shade and tops glow); `wind` stays as Air in motion.
- **Fine detail is band-limited.** Generators know their pixel footprint (`ctx.res`), so periodic detail (strata bedding, caustic lines, embers) fades or widens before it would alias, instead of shimmering on small canvases. This is analytic rather than `fwidth`, so it stays valid in any control flow.
- **Scenes** (`presets/scenes/*.aurora`) are art-directed multi-layer presets with their own golden images, starting with `northern-lights` (an aurora over the starfield) and `golden-hour` (clouds at sunset).
- **Docs and starters are generated** from the specs by a snapshot test (`docs/generators/*.md`, `presets/starters/*.aurora`), so they can't drift. Gradient starters add a grain overlay.
- **Budgets**: each generator under 2 kB gzip (largest: starfield, 1.9 kB), the noise library under 3 kB (1.4 kB).

## Consequences

- A generator's first use costs one small request; the CSS fallback covers the gap.
- Custom generators keep working everywhere, as long as they are registered before a surface uses them.
