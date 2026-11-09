# Changesets

Run `pnpm changeset` to describe a change to a published `@goatsoft/*` package. When a PR with a changeset is merged into `main`, the release workflow opens (or updates) a "Version Packages" PR; merging it publishes to npm with provenance and creates the GitHub Releases. See [AGENTS.md](../AGENTS.md#releasing).
