import { randomBytes, timingSafeEqual } from 'node:crypto'
import { readFile, readdir, realpath, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { parseAurora } from '@goatsoft/aurora-format'
import { validateDocument } from '@goatsoft/aurora'

/**
 * Studio's dev-tool mode: a tiny HTTP API that lets Aurora Studio (hosted or local) open a
 * project's `.aurora` files and save edits straight back to disk, where HMR picks them up.
 *
 * It is a write path from a browser to your disk, so it is narrow on purpose: every request needs
 * the session token printed in your terminal; only `.aurora` files inside the project root can be
 * read or written; writes must be valid documents; and only Studio's origins (and localhost) may
 * call it from a browser.
 */
export interface StudioApiOptions {
  /** The project root. Files outside it are never read or written. */
  root: string
  /** The session token; a random one is made if omitted. */
  token?: string
  /** Browser origins allowed to call the API, besides localhost. */
  origins?: readonly string[]
}

export interface StudioApi {
  token: string
  /** Mount at any path; requests whose URL doesn't start with `/__aurora/` fall through to `next`. */
  middleware: (req: IncomingMessage, res: ServerResponse, next?: () => void) => void
}

export const STUDIO_ORIGIN = 'https://aurora.goatsoft.io'
export const STUDIO_URL = `${STUDIO_ORIGIN}/studio/`
const PREFIX = '/__aurora/'
const SKIP = new Set(['node_modules', '.git', 'dist', 'coverage', '.turbo', '.cache'])
const MAX_BODY = 1024 * 1024

/** The link that opens Studio connected to this API. */
export function studioLink(api: string, token: string, studio = STUDIO_URL): string {
  const url = new URL(studio)
  url.searchParams.set('connect', api)
  url.searchParams.set('token', token)
  return url.toString()
}

async function list(root: string, dir = root): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.name.startsWith('.') && entry.name !== '.aurora') return []
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : list(root, path)
    return entry.isFile() && entry.name.endsWith('.aurora') ? [relative(root, path).split(sep).join('/')] : []
  }))
  return nested.flat().sort()
}

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

/**
 * Resolves a project-relative path, refusing anything that isn't a `.aurora` file inside the root,
 * including through symlinks (both the folder and, if it exists, the file itself).
 */
async function inside(root: string, path: string | null): Promise<string> {
  if (!path) throw new HttpError(400, 'Add ?path=<file>.aurora, relative to the project root.')
  if (isAbsolute(path) || !path.endsWith('.aurora')) throw new HttpError(400, `"${path}" must be a relative path to a .aurora file.`)
  const realRoot = await realpath(root)
  const within = (p: string | undefined) => p !== undefined && (p === realRoot || p.startsWith(realRoot + sep))
  const target = resolve(root, path)
  const folder = await realpath(dirname(target)).catch(() => undefined)
  const file = await realpath(target).catch(() => undefined)
  if (!within(folder) || (file !== undefined && !within(file))) throw new HttpError(403, `"${path}" is outside the project.`)
  return target
}

function body(req: IncomingMessage): Promise<string> {
  return new Promise((done, fail) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY) fail(new HttpError(413, 'A .aurora file must be under 1 MB.'))
      else chunks.push(chunk)
    })
    req.on('end', () => done(Buffer.concat(chunks).toString('utf8')))
    req.on('error', fail)
  })
}

function allowedOrigin(origin: string | undefined, origins: readonly string[]): boolean {
  if (!origin) return true
  if (origins.includes(origin)) return true
  try {
    const { hostname } = new URL(origin)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  } catch {
    return false
  }
}

function sameToken(given: string | undefined, token: string): boolean {
  if (!given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function createStudioApi({ root, token = randomBytes(18).toString('base64url'), origins = [STUDIO_ORIGIN] }: StudioApiOptions): StudioApi {
  const send = (res: ServerResponse, status: number, data: unknown) => {
    res.statusCode = status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(data))
  }

  async function handle(req: IncomingMessage, res: ServerResponse, url: URL) {
    const route = url.pathname.slice(PREFIX.length)
    if (route === 'files' && req.method === 'GET') {
      send(res, 200, { root: root.split(sep).at(-1), files: await list(root) })
      return
    }
    if (route === 'file' && req.method === 'GET') {
      const file = await inside(root, url.searchParams.get('path'))
      send(res, 200, { path: url.searchParams.get('path'), text: await readFile(file, 'utf8') })
      return
    }
    if (route === 'file' && req.method === 'PUT') {
      const path = url.searchParams.get('path')
      const file = await inside(root, path)
      const text = await body(req)
      const parsed = parseAurora(text)
      const issues = parsed.ok ? await validateDocument(parsed.doc) : parsed.issues
      if (issues.length) {
        send(res, 422, { error: `Not saved: ${path ?? ''} would be invalid.`, issues })
        return
      }
      await writeFile(file, text.endsWith('\n') ? text : `${text}\n`)
      send(res, 200, { path, saved: true })
      return
    }
    throw new HttpError(404, `No ${req.method ?? 'GET'} ${url.pathname}. Studio uses GET files, GET file and PUT file.`)
  }

  return {
    token,
    middleware(req, res, next) {
      const url = new URL(req.url ?? '/', 'http://localhost')
      if (!url.pathname.startsWith(PREFIX)) {
        next?.()
        return
      }
      const origin = req.headers.origin
      if (!allowedOrigin(origin, origins)) {
        send(res, 403, { error: `Origin ${origin ?? ''} may not use the Aurora Studio API.` })
        return
      }
      if (origin) {
        res.setHeader('access-control-allow-origin', origin)
        res.setHeader('vary', 'origin')
        res.setHeader('access-control-allow-headers', 'content-type, x-aurora-token')
        res.setHeader('access-control-allow-methods', 'GET, PUT, OPTIONS')
        // Lets the hosted Studio reach a dev server on localhost (Private Network Access).
        res.setHeader('access-control-allow-private-network', 'true')
      }
      if (req.method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
      }
      const given = req.headers['x-aurora-token']
      if (!sameToken(typeof given === 'string' ? given : undefined, token)) {
        send(res, 401, { error: 'Missing or wrong token. Open Studio from the link your terminal printed.' })
        return
      }
      handle(req, res, url).catch((error: unknown) => {
        if (error instanceof HttpError) send(res, error.status, { error: error.message })
        else if ((error as NodeJS.ErrnoException).code === 'ENOENT') send(res, 404, { error: `${url.searchParams.get('path') ?? 'That file'} doesn't exist.` })
        else send(res, 500, { error: (error as Error).message })
      })
    },
  }
}
