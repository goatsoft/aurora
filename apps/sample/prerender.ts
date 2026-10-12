import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = import.meta.dirname
const { render } = await import(resolve(root, 'dist/server/entry-server.js')) as { render: () => Promise<string> }
const template = await readFile(resolve(root, 'dist/client/index.html'), 'utf8')
await writeFile(resolve(root, 'dist/client/index.html'), template.replace('<!--app-->', await render()))
console.log('Prerendered dist/client/index.html')
