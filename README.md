# Aurora

WebGPU animated backgrounds with a CSS fallback, from GOATsoft.

Design a background in **Aurora Studio**, export a `.aurora` file and drop it into any site. WebGPU renders it, and browsers without WebGPU get a generated CSS fallback. Colours are authored and blended in OKLab/OKLCH.

> Early development. See [PLAN.md](PLAN.md) for the roadmap. Packages publish to GitHub Packages under `@goatsoft`.

## Use

```ts
import { assertAurora } from '@goatsoft/aurora-format'
import { mountAurora } from '@goatsoft/aurora'
import hero from './hero.aurora?raw'

// Paints the CSS fallback at once, then crossfades to WebGPU after its first frame.
const surface = mountAurora(document.querySelector('.hero')!, assertAurora(hero))
```

`<aurora-bg>`, Vue bindings and a bundler plugin (`import hero from './hero.aurora'`) arrive in Phase 3. The GOAT pack in [`presets/goat`](presets/goat) is a good place to start.

| Package | What it is |
|---|---|
| `@goatsoft/aurora` | WebGPU runtime: worker pool, WGSL composer, scenes, CSS fallback |
| `@goatsoft/aurora-format` | The `.aurora` format: schema, validation, migrations, JSON Schema |
| `@goatsoft/color` | OKLab/OKLCH, sRGB/P3, gamut mapping, ΔE-OK, CSS colour parsing |

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
