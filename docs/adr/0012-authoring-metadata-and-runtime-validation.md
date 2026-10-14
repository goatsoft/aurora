# ADR-0012: Authoring metadata and runtime validation

Status: Accepted

## Context

The element was at 13.98 kB gzip against its 14 kB budget. Editor descriptions were travelling with runtime validation, which encouraged shortening Studio hints and left almost no room for future format rules.

## Decision

Keep the public `AuroraSchema` fully annotated for authoring and JSON Schema generation. Derive a separate runtime validator from its TypeScript syntax tree, removing only descriptions, titles, examples and their helper arguments. `parseAurora` and migrations use this generated validator. Validation rules, defaults, migrations and diagnostics remain identical.

`MODIFIERS` keeps complete Studio descriptions. Its generated source uses TypeScript's string-literal printer, which escapes apostrophes, backslashes and line breaks. The published JSON Schema and modifier reference retain those full descriptions.

Regenerate with `pnpm test -u`. Snapshot tests compare the generated validators with their source, JSON Schema comparisons check every structural constraint, and differential tests check valid documents, arbitrary JSON values and exact diagnostics. Generated source passes the same ESLint formatting rules as authored source.

## Consequences

- The element ships validation rules without editor prose. No chunks are moved out of the measurement and no size budget is raised.
- The exported authoring schema, Studio controls and editor autocomplete keep their metadata.
- Generated validators must be committed alongside source changes. Verification fails when they drift.
- The element measures 13.22 kB gzip after this change, leaving about 0.78 kB for future changes. Future growth still needs measurement.
