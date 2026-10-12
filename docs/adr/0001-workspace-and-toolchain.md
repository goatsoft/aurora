# ADR-0001: Workspace and toolchain

Status: accepted · 12 October 2026

## Context

Aurora ships several packages (color, format, runtime, bindings, Studio, gruff) and a site from one repo. Every change should be checked against real WebGPU, not a mock, because the runtime's whole contract is "never claim WebGPU before a real frame".

## Decision

- **pnpm workspaces** (`packages/*`, `apps/*`), Node ≥ 24 (pinned in `.nvmrc`), ESM only.
- **TypeScript 5.9** in strict mode with project references. `tsc -b` is the typecheck.
- Workspace packages export a `@goatsoft/source` condition pointing at `src/index.ts`. TypeScript, Vite and Vitest resolve it, so packages consume each other's sources with no prior build. Published builds ignore it.
- **Vite 8** library mode builds each package to `dist/` (ESM, dependencies external). `tsc` emits the declarations.
- **Vitest 4** with two projects:
  - `unit`: Node environment, `test/**/*.test.ts`.
  - `browser`: Playwright Chromium, `test/**/*.browser.test.ts`. Chromium runs with `--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader`, which gives a real WebGPU adapter on GPU-less CI runners. A harness test runs a compute pass so a broken setup fails loudly.
- **ESLint 10** flat config with `typescript-eslint` strict and stylistic type-checked rules. Formatting is ESLint Stylistic (`@stylistic/eslint-plugin`: 2 spaces, single quotes, no semicolons), fixed by `pnpm lint:fix`. Import order (type imports first) is perfectionist's `sort-imports`; Vue SFCs use eslint-plugin-vue's recommended rules; Tailwind classes are kept canonical and ordered by eslint-plugin-better-tailwindcss, against each app's theme. No Prettier, so there is one tool and one config.
- **Changesets** for versions and changelogs. `@goatsoft/*` packages are linked and publish to GitHub Packages once Phase 2 parity passes.
- **`pnpm verify`** (lint, typecheck, all tests, build) is the single gate, run locally and in CI.

## Consequences

- SwiftShader is slower than a GPU and not pixel-identical to every vendor. Golden-image tests in Phase 2 must be generated and compared under the same adapter.
- `playwright` is pinned exactly so the local and CI Chromium builds match.
