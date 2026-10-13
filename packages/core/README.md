# @goatsoft/aurora

Animated WebGPU backgrounds with a generated CSS fallback. Design one in [Aurora Studio](https://aurora.goatsoft.io/studio/), save it as a `.aurora` file, and put it on any page.

```sh
npm install @goatsoft/aurora
```

```ts
import { mountAurora } from '@goatsoft/aurora'
import hero from './hero.aurora'

const surface = mountAurora(document.querySelector('#hero')!, hero)
```

Importing `.aurora` files needs [`@goatsoft/aurora-unplugin`](https://www.npmjs.com/package/@goatsoft/aurora-unplugin). Without a bundler, load a file by URL with the custom element:

```html
<script type="module">
  import '@goatsoft/aurora/element'
</script>

<section style="position: relative">
  <aurora-bg src="/hero.aurora"></aurora-bg>
</section>
```

## Entry points

| Import | What it is |
|---|---|
| `@goatsoft/aurora` | `mountAurora()`, the runtime and generators |
| `@goatsoft/aurora/element` | The `<aurora-bg>` custom element |
| `@goatsoft/aurora/load` | `loadAurora()`: load and validate a `.aurora` file by URL |
| `@goatsoft/aurora/poster` | `renderPoster()`: one frame as a PNG, for `og:image` and posters |
| `@goatsoft/aurora/roles` | What each generator's colours paint |
| `@goatsoft/aurora/badge` | Optional "Made with Aurora" attribution badges |

Using Vue? See [`@goatsoft/aurora-vue`](https://www.npmjs.com/package/@goatsoft/aurora-vue).

## Links

- [Documentation](https://aurora.goatsoft.io/docs)
- [Getting started](https://aurora.goatsoft.io/docs/guide/getting-started)
- [The runtime](https://aurora.goatsoft.io/docs/guide/runtime)
- [Source on GitHub](https://github.com/goatsoft/aurora)

## Licence

MIT. The Aurora name and mark have [separate terms](https://github.com/goatsoft/aurora/blob/main/LICENSE-ART.md).
