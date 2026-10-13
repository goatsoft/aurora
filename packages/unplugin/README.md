# @goatsoft/aurora-unplugin

Import `.aurora` files in Vite, Rollup, Rolldown, esbuild, webpack and Rspack. Each file is validated at build time (errors point at the file, line and column), its CSS fallback is inlined, and edits hot-reload in place.

```sh
npm install -D @goatsoft/aurora-unplugin
```

```ts
// vite.config.ts
import aurora from '@goatsoft/aurora-unplugin/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [aurora()],
})
```

Use `@goatsoft/aurora-unplugin/rollup`, `/rolldown`, `/esbuild`, `/webpack` or `/rspack` for other bundlers. For typed imports, add `"@goatsoft/aurora-unplugin/client"` to `compilerOptions.types` in your `tsconfig.json`.

In a Vite project, the dev server prints an **Aurora Studio** link that opens your project's `.aurora` files and saves edits back to disk. Without Vite, run `npx aurora studio`.

## Links

- [Getting started](https://aurora.goatsoft.io/docs/guide/getting-started)
- [The .aurora format](https://aurora.goatsoft.io/docs/guide/format)
- [Source on GitHub](https://github.com/goatsoft/aurora)

## Licence

MIT. The Aurora name and mark have [separate terms](https://github.com/goatsoft/aurora/blob/main/LICENSE-ART.md).
