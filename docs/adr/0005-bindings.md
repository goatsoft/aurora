# ADR-0005: Bindings: element, Vue and the bundler plugin

Status: accepted · 12 October 2026

## Context

Every GOATsoft site has to drop in a background in one line, with no flash of empty space, server rendering where the site has it, and errors that are caught before they reach a browser.

## Decision

- **`<aurora-bg>` lives in core** as `@goatsoft/aurora/element` (a side-effect entry). It uses light DOM, because document-level keyframes don't reach into shadow roots, and a zero-specificity `:where(aurora-bg)` default so it fills its parent and any author style wins. Its mode is a custom state (`:state(webgpu)`, `:state(css)`) and an `aurora-mode` event; bad files raise `aurora-error` and a console error listing every issue against the URL. It validates at runtime, so it carries the Valibot schema (11 kB gzip, budgeted at 14 kB).
- **`@goatsoft/aurora-vue`** is written in TypeScript with `h()`, so the package needs no SFC build. `<AuroraBackground>` server-renders the CSS fallback (from the module's precompiled CSS, or compiled from a document). On the client, `mountAurora` paints its own fallback synchronously in `onMounted`, and the server fallback is removed in the same task, so the page never shows zero or two fallbacks and hydration never mismatches. URLs load lazily through `@goatsoft/aurora/load`.
- **`@goatsoft/aurora-unplugin`** loads `.aurora` files, validates them against the format and the generator registry, and fails the build with every issue at `file:line:column`, located by a small JSONPath-to-offset scanner, so editors' error overlays land on the exact key. It emits `{ id, doc, css }`, with the id relative to the project root so bundles carry no absolute paths. On Vite HMR it calls `hotUpdate()`, which updates every live surface using that file in place.
- **`mountAurora` takes documents or modules.** A module registers for hot updates by id.
- **`@webgpu/types` is a dependency of core**, referenced from its declarations, because the public types mention GPU types.

## Consequences

- With the plugin, files never need validating in the browser; `<aurora-bg src>` is the only path that pays for the schema.
- The sample app (`apps/sample`) is tested against the built packages (`pnpm test:apps`, after `pnpm build` in `pnpm verify`) by running Vite outside Vitest in a child process, as a real app does: SSR output and the client build. Vitest's own module interception would otherwise resolve externalised workspace packages to their TypeScript sources.
