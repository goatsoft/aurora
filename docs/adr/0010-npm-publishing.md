# ADR-0010: Publishing to npm with provenance

Status: accepted

## Context

PLAN.md originally published `@goatsoft/*` to GitHub Packages only. GitHub's npm registry needs a token with `read:packages` to install, even for public packages, so every consuming site and CI job would need an `.npmrc` and a secret. That is the opposite of the one-line install Aurora promises. Nothing had been published there yet.

The workspace also resolves packages through the `@goatsoft/source` condition, so the apps, tests and the sample never run the built `dist/`. A packaging mistake (a missing export, an unpublished file, an asset URL that only works in the repo) would reach users unnoticed. Packing the packages for this decision found one: core's worker URL was root-absolute (`new URL('/assets/worker-….js', import.meta.url)`), which resolves against the consuming site instead of the package.

## Decision

Publish to **npm** (registry.npmjs.org) under the `@goatsoft` org, with **provenance**, and a GitHub Release per package.

- `release.yml` runs on `main`. It calls `ci.yml` first, so nothing publishes unless CI passes on that commit, then runs `changesets/action`: pending changesets open a "Version Packages" PR, and merging it publishes and creates the releases. Publishing runs in the `npm` GitHub environment.
- The first release authenticates with an `NPM_TOKEN` (a short-lived granular token) in that environment. After it, each package switches to npm trusted publishing (OIDC, tied to `release.yml` and the `npm` environment), the token is deleted, and the packages refuse token publishes.
- Five packages publish: `@goatsoft/aurora`, `-vue`, `-unplugin`, `-format` and `@goatsoft/color`. gruff and editor-ui stay private, and Changesets never versions or tags private packages.
- Each package ships its own README and, through `prepack`, a copy of the MIT `LICENSE`. `src/` is not published; the `@goatsoft/source` condition stays in `exports` for the workspace and points at nothing in the tarball.
- Libraries build with `base: './'`, so emitted assets are referenced relative to the chunk that uses them.
- `pnpm consumers` (and the CI job of the same name) packs every package, checks the tarballs (files, exports, bin, absolute asset URLs, publint, arethetypeswrong), then installs them with npm into a fresh project and builds it with Vite and Vue, Rollup, Rolldown, esbuild, webpack and Rspack.
- 0.1.0 collects the pre-release history into one "Initial release" changeset.

## Consequences

Installing Aurora needs nothing but `npm install`. Every published version is traceable to a commit and workflow run. Releases go through two PRs (the release branch into `main`, then "Version Packages"), and `main` is merged back into `develop` after each. The consumer check adds a CI job of about a minute.
