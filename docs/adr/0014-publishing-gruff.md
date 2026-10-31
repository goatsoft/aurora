# ADR-0014: Publishing gruff

Status: accepted · 1 November 2026

## Context

ADR-0008 kept gruff private until another GOATsoft site needed it. Lucy's docs site now does: it ran a copy of gruff and of the site's six docs components, and the two copies had already drifted (Lucy gained a dev-server page watcher, `sidebarTitle` and breadcrumbs; Aurora had the live `aurora` fence). Keeping two copies in step by hand doesn't last.

The docs components are the awkward part. Aurora's published Vue components may only bind styles computed by core, because they can't rely on a consumer's Tailwind build. The docs components are the opposite case: they are a site's chrome, they should look like the site, and the sites using them are Tailwind sites.

## Decision

- **Publish `@goatsoft/gruff`** from `packages/gruff`, with provenance, like the other packages (ADR-0010). Its README and `docs/` (in the repo, linked from the README) are written so a developer or an agent can build a site from them alone.
- **One core.** Lucy's copy and Aurora's merged: the dev-server watcher, `sidebarTitle`, and the union of both sites' languages. The `aurora` fence became a general option, `highlight.fences`, and Aurora's site passes its `<AuroraDemo>` renderer in; gruff knows nothing about Aurora.
- **`@goatsoft/gruff/vue`** ships the docs components (`DocPage`, `DocToc`, `SearchDialog`, `CodeGroup`, `CopyButton`, `Term`) and `gruffDocs()`, a Vue plugin that takes what used to be site imports (the nav, the search data, breadcrumbs, the head hook) as options. Icons are components passed in `icons`, with small inline-SVG defaults, because gruff's Markdown renders some components itself, where a site couldn't pass slots.
- **The Tailwind exception.** `@goatsoft/gruff/vue` is styled with Tailwind 4 classes against shadcn-style tokens (`background`, `foreground`, `muted-foreground`, `surface`, `border`, `primary`, `ring`, `spectrum-1`, `spectrum-2`) and a `glass` utility, listed in `packages/gruff/docs/components.md`. Sites add the package's `dist` with `@source`. Lint checks the classes against `apps/site`'s theme, which defines the full set. This applies only to gruff's docs components; Aurora's own published components keep the core-styles-only rule.
- **`@goatsoft/gruff/client`** declares `virtual:gruff` and `.md` imports, so sites don't each write them.
- `vue-router` and `reka-ui` are optional peers: only `/vue` needs them.

## Consequences

- Lucy's site drops its copy (`libs/gruff` and the six components) and the Vite resolver workaround for the source condition once a version is on npm.
- The first publish of a new package can't use trusted publishing (npm needs the package to exist to configure its trusted publisher), so `@goatsoft/gruff`'s first version goes out once with a short-lived token, as 0.1.0 of the other packages did (ADR-0010).
- The docs components' look is now shared by two sites. Changes to it are changes to a published package, with a changeset.
