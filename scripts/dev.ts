/**
 * `pnpm dev`: the site with Studio at /studio/, the way aurora.goatsoft.io serves them, on one
 * port. The site's Vite server proxies /studio/ (and Studio's HMR socket) to a second Vite server
 * running Studio with base /studio/, and its "Aurora Studio" link opens that local Studio, which
 * can then open and save this repo's .aurora files through the site's dev-tool API.
 *
 * Each app runs from its own folder, as `pnpm --filter … dev` would: unplugin-icons finds icon
 * sets from the working directory. The site's config loads the unplugin and gruff from dist, so
 * those two are built first.
 */
import { execFileSync, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { createServer, searchForWorkspaceRoot } from 'vite'

const root = searchForWorkspaceRoot(import.meta.dirname)
const SITE_PORT = Number(process.env['PORT'] ?? 5180)
const STUDIO_PORT = SITE_PORT + 1
const site = `http://localhost:${SITE_PORT}`

// The pnpm running this script (npm_execpath), so its pinned version builds the packages too.
const pnpm = process.env['npm_execpath']
const filters = ['--filter', '@goatsoft/aurora-unplugin', '--filter', '@goatsoft/gruff', 'build']
execFileSync(pnpm ? process.execPath : 'pnpm', pnpm ? [pnpm, ...filters] : filters, { cwd: root, stdio: 'inherit' })

// Studio, in its own process and folder, served under /studio/ like the hosted build.
const studioDir = join(root, 'apps/studio')
const vite = join(dirname(createRequire(join(studioDir, 'package.json')).resolve('vite/package.json')), 'bin/vite.js')
const studio = spawn(process.execPath, [vite, '--configLoader', 'runner', '--port', String(STUDIO_PORT), '--strictPort', '--logLevel', 'warn'], {
  cwd: studioDir,
  env: { ...process.env, STUDIO_BASE: '/studio/' },
  stdio: ['ignore', 'inherit', 'inherit'],
})
studio.on('exit', (code) => {
  if (code) console.error(`Studio's dev server exited with code ${code}.`)
})

// The site, here, with its "Aurora Studio" link pointing at the proxied local Studio.
process.chdir(join(root, 'apps/site'))
process.env['AURORA_STUDIO_URL'] = `${site}/studio/`
const server = await createServer({
  configFile: join(root, 'apps/site/vite.config.ts'),
  configLoader: 'runner',
  server: {
    port: SITE_PORT,
    strictPort: true,
    proxy: { '/studio': { target: `http://localhost:${STUDIO_PORT}`, ws: true } },
  },
})
await server.listen()
server.printUrls()
server.config.logger.info(`  \u001B[36m➜\u001B[0m  Studio:  ${site}/studio/`)

async function close() {
  studio.kill()
  await server.close()
  process.exit(0)
}
process.on('SIGINT', () => void close())
process.on('SIGTERM', () => void close())
