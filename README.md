# Aurora

WebGPU animated backgrounds with a CSS fallback, from GOATsoft.

Design a background in **Aurora Studio**, export a `.aurora` file and drop it into any site. WebGPU renders it, and browsers without WebGPU get a generated CSS fallback. Colours are authored and blended in OKLab/OKLCH.

> Early development. See [PLAN.md](PLAN.md) for the roadmap. Packages publish to GitHub Packages under `@goatsoft`.

## Development

Requires Node 24+ (see `.nvmrc`) and pnpm 10 (`corepack enable`).

```sh
pnpm install
pnpm exec playwright install chromium   # once, for browser tests
pnpm verify                             # lint, typecheck, unit + WebGPU browser tests, build
```

| Script | What it does |
|---|---|
| `pnpm test` | Unit tests (Node) |
| `pnpm test:browser` | Browser tests in headless Chromium with real WebGPU |
| `pnpm lint:fix` | Fix lint and formatting (ESLint Stylistic) |
| `pnpm coverage` | Unit tests with V8 coverage |
| `pnpm changeset` | Record a change for the next release |

Tooling decisions live in [docs/adr](docs/adr). Agent and contributor rules are in [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)
