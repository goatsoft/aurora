# @goatsoft/aurora-format

The `.aurora` file format: its schema, validation and migrations, plus the JSON Schema that editors use to autocomplete `.aurora` files.

```sh
npm install @goatsoft/aurora-format
```

```ts
import { parseAurora } from '@goatsoft/aurora-format'

const parsed = parseAurora(text)
if (parsed.ok) console.log(parsed.doc.layers)
else console.error(parsed.issues)
```

The JSON Schema is at `@goatsoft/aurora-format/schema/v1.json`, and online at [aurora.goatsoft.io/schema/v1.json](https://aurora.goatsoft.io/schema/v1.json).

You need this package directly only to read or write `.aurora` files yourself. To show backgrounds, use [`@goatsoft/aurora`](https://www.npmjs.com/package/@goatsoft/aurora).

## Links

- [The .aurora format](https://aurora.goatsoft.io/docs/guide/format)
- [Source on GitHub](https://github.com/goatsoft/aurora)

## Licence

MIT.
