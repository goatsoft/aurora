#!/usr/bin/env node
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { createStudioApi, STUDIO_URL, studioLink } from './studio'

const USAGE = `Usage: aurora studio [options]

Opens Aurora Studio on this project's .aurora files: Studio lists them, and saving writes back to disk.

Options:
  --root <dir>     Project root (default: the current directory)
  --port <port>    Port for the local file API (default: 4920)
  --studio <url>   Studio to open (default: ${STUDIO_URL})
  -h, --help       Show this help`

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    root: { type: 'string', default: '.' },
    port: { type: 'string', default: '4920' },
    studio: { type: 'string', default: STUDIO_URL },
    help: { type: 'boolean', short: 'h' },
  },
})

if (values.help || positionals[0] !== 'studio') {
  console.log(USAGE)
  process.exit(values.help ? 0 : 1)
}

const root = resolve(values.root)
const port = Number(values.port)
const api = createStudioApi({ root })
const server = createServer((req, res) => {
  api.middleware(req, res, () => {
    res.statusCode = 404
    res.end('Aurora Studio API: open the link printed in the terminal.')
  })
})
server.listen(port, '127.0.0.1', () => {
  console.log(`\nAurora Studio is ready for ${root}\n\n  Open: ${studioLink(`http://localhost:${port}/__aurora/`, api.token, values.studio)}\n\nPress Ctrl+C to stop.`)
})
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Try aurora studio --port ${port + 1}.` : error.message)
  process.exit(1)
})
