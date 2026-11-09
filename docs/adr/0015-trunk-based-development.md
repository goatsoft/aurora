# ADR-0015: Trunk-based development

Status: accepted · 9 November 2026 · amends ADR-0010

## Context

Aurora ran git flow: features into `develop`, a `release/<version>` branch into `main` with a merge commit, the "Version Packages" PR, then `main` merged back into `develop`. A release took three PRs and a back-merge, every merge had to be a merge commit or the branches diverged, and `develop` and `main` carried the same code between releases. For one maintainer and a release workflow that already batches changes through changesets, `develop` added steps without adding safety.

## Decision

- **`main` is the only long-lived branch.** Short-lived `feature/…` or `fix/…` branches come off `main`, and PRs into `main` are squash-merged once CI passes.
- **Changesets decide what is released, the "Version Packages" PR decides when.** Every push to `main` runs `release.yml`, which keeps that PR up to date with the pending changesets. Merging it publishes, as in ADR-0010.
- No `develop`, `release/…` or `hotfix/…` branches, and no back-merges. A fix is a normal PR into `main`.
- The site deploys on every push to `main`.

## Consequences

- A release is one feature PR plus the "Version Packages" PR, and nothing has to be merged back.
- `main` always holds unreleased work between releases; the "Version Packages" PR shows exactly what the next release contains.
- The site can run ahead of the published packages, which also satisfies the rule that the site deploys before packages that point at new hosted URLs.
- Squash merges are fine everywhere, since no branch has to stay in step with another.
