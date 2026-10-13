/**
/* packages the way npm will serve them, not the
 * way the workspace sees them (the apps resolve `@goatsoft/source`, so they never run `dist`).
 *
 * 1. Builds and packs each package (`pnpm pack`, so `workspace:` ranges are rewritten and
 *    `prepack` adds the LICENSE).
 * 2. Checks each tarball: LICENSE and README present, no sources, tests or brand assets, every
 *    export and bin present, no root-absolute asset URLs; then publint and arethetypeswrong.
 * 3. Installs the tarballs with npm into a fresh copy of test/consumers and builds it with Vite
 *    (and Vue), Rollup, Rolldown, esbuild, webpack and Rspack, checking each output.
 *
 * `--no-build` skips step 1's build. The working directory is kept when a check fails, or with
 * `--keep`.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { publint } from 'publint'
import { formatMessage } from 'publint/utils'

interface Manifest {
  name: string
  version: string
  exports: Record<string, string | Record<string, string>>
  bin?: Record<string, string>
}

const root = resolve(import.meta.dirname, '..')
const PUBLISHED = ['color', 'format', 'core', 'vue', 'unplugin']
const BUNDLERS = ['vite', 'rollup', 'rolldown', 'esbuild', 'webpack', 'rspack']
/** Bundlers that copy `new URL('…', import.meta.url)` assets, so core's worker ships with the app. */
const COPIES_WORKER = new Set(['vite', 'webpack', 'rspack'])
/** A string only core's worker contains (see packages/core/src/worker.ts); minifiers keep it. */
const WORKER_MARKER = 'No OffscreenCanvas WebGPU.'
/** The workspace-only export condition: it points at `src/`, which isn't published. */
const SOURCE_CONDITION = '@goatsoft/source'

const problems: string[] = []
const fail = (message: string) => problems.push(message)
const log = (message: string) => process.stdout.write(`${message}\n`)

function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

// The pnpm running this script (npm_execpath), so its pinned version packs too.
const pnpmPath = process.env['npm_execpath']
const pnpm = (args: string[], cwd: string) => (pnpmPath ? run(process.execPath, [pnpmPath, ...args], cwd) : run('pnpm', args, cwd))

/** Every file under `dir`, relative to it, with `/` separators. */
function walk(dir: string, base = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path, base) : [relative(base, path).split('\\').join('/')]
  })
}

/** The message of a failed command, with its output. */
function output(error: unknown): string {
  const { stdout, stderr, message } = error as { stdout?: string, stderr?: string, message: string }
  return [stdout, stderr].filter(Boolean).join('\n').trim() || message
}

const work = mkdtempSync(join(tmpdir(), 'aurora-consumers-'))
const packs = join(work, 'packs')
mkdirSync(packs)

if (!process.argv.includes('--no-build')) {
  log('Building the packages')
  pnpm(['-r', '--filter', '@goatsoft/*', 'build'], root)
}

// 1 and 2: pack, unpack and inspect each package.
const tarballs: Record<string, string> = {}
for (const dir of PUBLISHED) {
  const source = join(root, 'packages', dir)
  const { name, version } = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')) as Manifest
  pnpm(['pack', '--pack-destination', packs], source)
  const tarball = join(packs, `${name.slice(1).replace('/', '-')}-${version}.tgz`)
  tarballs[name] = tarball

  const unpacked = join(work, 'unpacked', dir)
  mkdirSync(unpacked, { recursive: true })
  run('tar', ['-xzf', tarball, '-C', unpacked], root)
  const pkgDir = join(unpacked, 'package')
  const files = walk(pkgDir)
  const manifest = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')) as Manifest
  log(`${name}: ${files.length} files`)

  for (const required of ['LICENSE', 'README.md']) {
    if (!files.includes(required)) fail(`${name}: the tarball has no ${required}`)
  }
  for (const file of files) {
    if (file.startsWith('src/') || /(^|\/)test\//.test(file)) fail(`${name}: ships ${file}`)
    if (file.includes('brand/')) fail(`${name}: ships brand artwork (${file})`)
  }
  if (JSON.stringify(manifest).includes('workspace:')) fail(`${name}: package.json still has a workspace: range`)

  for (const [subpath, targets] of Object.entries(manifest.exports)) {
    const conditions = typeof targets === 'string' ? { default: targets } : targets
    for (const [condition, target] of Object.entries(conditions)) {
      if (condition !== SOURCE_CONDITION && !files.includes(target.replace(/^\.\//, ''))) {
        fail(`${name}: exports["${subpath}"].${condition} is ${target}, which isn't in the tarball`)
      }
    }
  }
  for (const [command, target] of Object.entries(manifest.bin ?? {})) {
    const file = target.replace(/^\.\//, '')
    if (!files.includes(file)) fail(`${name}: bin ${command} is ${target}, which isn't in the tarball`)
    else if (!readFileSync(join(pkgDir, file), 'utf8').startsWith('#!/usr/bin/env node')) fail(`${name}: bin ${command} has no #!/usr/bin/env node`)
  }
  for (const file of files.filter((f) => f.endsWith('.js'))) {
    if (/new URL\(\s*["'`]\//.test(readFileSync(join(pkgDir, file), 'utf8'))) {
      fail(`${name}: ${file} has a root-absolute new URL(), which resolves against the consuming site, not the package`)
    }
  }
  if (dir === 'core') {
    const worker = files.find((f) => /^dist\/assets\/worker-[\w-]+\.js$/.test(f))
    if (!worker) fail(`${name}: no dist/assets/worker-*.js`)
    else if (!readFileSync(join(pkgDir, worker), 'utf8').includes(WORKER_MARKER)) fail(`${name}: ${worker} doesn't look like the worker (no "${WORKER_MARKER}")`)
  }

  const { messages } = await publint({ pkgDir, pack: false, level: 'warning' })
  for (const message of messages) {
    const text = formatMessage(message, manifest) ?? message.code
    // The source condition is deliberately unpublished: workspace tools resolve it, consumers never do.
    if (!text.includes(SOURCE_CONDITION)) fail(`${name}: publint ${message.type}: ${text}`)
  }

  try {
    run(join(root, 'node_modules/.bin/attw'), [tarball, '--profile', 'esm-only', '--format', 'ascii', '--no-emoji'], root)
  } catch (error) {
    fail(`${name}: arethetypeswrong found problems:\n${output(error)}`)
  }
}

// 3: a fresh project that installs the tarballs, built with each bundler.
const app = join(work, 'app')
cpSync(join(root, 'test/consumers'), app, { recursive: true, filter: (path) => !/[\\/](node_modules|dist)$/.test(path) })
const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')) as Record<string, unknown>
const dependencies = Object.fromEntries(Object.entries(tarballs).map(([name, tarball]) => [name, `file:${tarball}`]))
// The packages depend on each other by version, which isn't on the registry yet: use the tarballs.
writeFileSync(join(app, 'package.json'), JSON.stringify({ ...pkg, dependencies, overrides: dependencies }, null, 2))
log('Installing the tarballs into a fresh project')
try {
  run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], app)
} catch (error) {
  fail(`npm install failed:\n${output(error)}`)
}

if (!problems.length) {
  for (const bundler of BUNDLERS) {
    try {
      run(process.execPath, ['build.mjs', bundler], app)
    } catch (error) {
      fail(`${bundler}: the build failed:\n${output(error)}`)
      continue
    }
    const dist = join(app, 'dist', bundler)
    const emitted = walk(dist).map((file) => ({ file, content: readFileSync(join(dist, file)) }))
    const code = emitted.filter(({ file }) => file.endsWith('.js')).map(({ content }) => content.toString('utf8')).join('\n')
    const checks = [
      ['the compiled .aurora file', code.includes('Consumer check')],
      ['the runtime', code.includes('aurora-drift')],
    ] as const
    for (const [what, found] of checks) if (!found) fail(`${bundler}: the output has no ${what}`)
    // The worker is its own file (bundlers may rename and re-minify it), never inlined into the app.
    const copied = emitted.some(({ file, content }) => file.endsWith('.js') && content.toString('utf8').includes(WORKER_MARKER))
    if (COPIES_WORKER.has(bundler) && !copied) fail(`${bundler}: core's worker wasn't emitted with the app`)
    log(`${bundler}: built ${emitted.length} files${copied ? ', worker included' : ''}`)
  }

  try {
    const help = run(join(app, 'node_modules/.bin/aurora'), ['--help'], app)
    if (!help.includes('aurora studio')) fail(`npx aurora --help printed:\n${help}`)
  } catch (error) {
    fail(`npx aurora --help failed:\n${output(error)}`)
  }
}

if (problems.length) {
  process.stderr.write(`\n${problems.length} problem${problems.length === 1 ? '' : 's'} (working files kept in ${work}):\n\n${problems.map((p) => `- ${p}`).join('\n')}\n`)
  process.exit(1)
}
if (process.argv.includes('--keep')) log(`Working files kept in ${work}`)
else rmSync(work, { recursive: true, force: true })
log('\nThe packed packages install and build with every bundler.')
