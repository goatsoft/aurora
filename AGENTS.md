# AGENTS.md

Instructions for AI agents and humans working in this repo. [PLAN.md](PLAN.md) is the roadmap and source of truth for scope; read the current phase there before starting work.

## What this is

Aurora: a GOATsoft library for WebGPU-only animated backgrounds with a generated CSS fallback, plus Aurora Studio (builder), `@goatsoft/color` (shared OKLab maths), gruff (our static site generator) and the aurora.goatsoft.io site. One repo holds all of it.

## Stack

- **Node 24** (`.nvmrc`), **pnpm 10** workspaces (`packages/*`, `apps/*`), ESM only.
- **TypeScript 5.9**, strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). Typecheck is `tsc -b` over project references.
- **Vite 8** library mode builds each package to `dist/`; `tsc` emits declarations.
- **Vitest 4**: `unit` project (Node) and `browser` project (Playwright Chromium with real WebGPU via SwiftShader).
- **ESLint 10** flat config: typescript-eslint strict + stylistic type-checked, and **ESLint Stylistic for formatting**. There is no Prettier.
- **Changesets** for versioning; `@goatsoft/*` publishes to GitHub Packages (after Phase 2).
- **Valibot** for `.aurora` validation; **fast-check** for fuzz tests.
- Later phases add Vue 3.5, vue-router 5, Tailwind 4, shadcn-vue, and gruff on `unplugin-vue-markdown` (see PLAN.md §3–5).

## Layout

```
packages/color    @goatsoft/color           OKLab/OKLCH, sRGB/P3, gamut mapping, ΔE-OK, CSS colour parsing (0 deps)
packages/format   @goatsoft/aurora-format   .aurora schema, validation, migrations
packages/core     @goatsoft/aurora          WebGPU runtime, WGSL composer, CSS fallback
docs/adr/         Architecture decision records
```

Each package: `src/index.ts` entry, tests in `test/`. Packages export a `@goatsoft/source` condition pointing at `src/`, so cross-package imports use sources and tests never need a build. Use the package name (`@goatsoft/aurora-format`), never a relative path into another package.

## Commands

```sh
pnpm install
pnpm verify          # lint + typecheck + all tests + build. Must pass before every push.
pnpm lint:fix        # fixes lint and formatting
pnpm test            # unit tests
pnpm test:browser    # WebGPU browser tests (needs `pnpm exec playwright install chromium` once)
pnpm coverage
pnpm changeset       # for any user-facing change to a @goatsoft/* package
```

## North star

Aurora must be very, very slick. It should blow people away visually and in its DX. Every change is judged against that: no visual glitches, beautiful defaults, errors that say exactly what is wrong and how to fix it, types that autocomplete everything.

## Rules

### Git

- **Git flow.** `main` is releases, `develop` is integration. Work on `feature/<short-name>` (or `fix/…`, `release/…`, `hotfix/…`) branched from `develop`; PRs target `develop`.
- **Never** create `claude/…` or other agent-named branches.
- Never push directly to `main` or `develop`, and never force-push a shared branch.
- Conventional commits: `feat(core): …`, `fix(format): …`, `chore: …`, `ci: …`, `docs: …`.
- Don't put model names or identifiers in commits, PRs or code.

### Code

- Formatting: 2 spaces, single quotes, no semicolons. Run `pnpm lint:fix`; don't hand-format.
- `import type` for type-only imports (lint enforces it).
- WebGPU only. No WebGL or GLSL path, ever; the fallback is CSS.
- `.aurora` files are declarative JSON and must never carry executable code or WGSL.
- Colours are authored and mixed in OKLab/OKLCH; `mix: "srgb"` exists only for GOAT parity. All colour maths goes in `@goatsoft/color`; never reimplement it elsewhere.
- Never report WebGPU (`data-aurora="webgpu"`) before a real frame has rendered.
- Respect the budgets in PLAN.md §3.2 (core < 10 kB gzip, each generator < 2 kB).
- Backgrounds are always `aria-hidden` and honour `prefers-reduced-motion`.

### Tests

- New behaviour gets a test. Anything touching the GPU gets a `*.browser.test.ts`.
- Never skip, disable or loosen a test to get green; fix the cause.
- Golden images are generated and compared under the same (SwiftShader) adapter.

### Docs

- Record significant decisions as an ADR in `docs/adr/NNNN-title.md`.
- Keep this file and PLAN.md current when the stack or rules change.

### Dependencies

- Dependencies are managed by the maintainer. Don't add, remove or upgrade them without being asked. `playwright` is pinned exactly so local and CI Chromium match.
