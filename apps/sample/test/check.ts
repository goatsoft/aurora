// Runs the sample the way a real app does, outside Vitest: SSR via Vite, then a client build.
import { build, createServer } from 'vite'

const root = new URL('..', import.meta.url).pathname
type Output = Awaited<ReturnType<typeof build>>
const server = await createServer({ root, configLoader: 'runner', logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom' })
const { render } = await server.ssrLoadModule('/src/entry-server.ts') as { render: () => Promise<string> }
const html = await render()
await server.close()

const output: Output = await build({ root, configLoader: 'runner', logLevel: 'error', build: { write: false } })
const code = (Array.isArray(output) ? output : [output]).flatMap((o) => ('output' in o ? o.output : [])).map((o) => ('code' in o ? o.code : '')).join('\n')

process.stdout.write(JSON.stringify({ html, code, root }))
