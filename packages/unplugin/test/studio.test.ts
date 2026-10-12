import type { AddressInfo } from 'node:net'
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { createStudioApi, studioLink } from '@/studio'

const hero = readFileSync(`${inject('root')}/presets/classic/hero.aurora`, 'utf8')
const root = mkdtempSync(join(tmpdir(), 'aurora-studio-'))
const outside = mkdtempSync(join(tmpdir(), 'aurora-outside-'))
mkdirSync(join(root, 'presets'))
mkdirSync(join(root, 'node_modules', 'x'), { recursive: true })
writeFileSync(join(root, 'presets', 'hero.aurora'), hero)
writeFileSync(join(root, 'node_modules', 'x', 'skip.aurora'), hero)
writeFileSync(join(outside, 'secret.aurora'), hero)
symlinkSync(join(outside, 'secret.aurora'), join(root, 'presets', 'link.aurora'))
symlinkSync(outside, join(root, 'escape'))

const api = createStudioApi({ root, token: 'test-token' })
const server = createServer((req, res) => api.middleware(req, res, () => {
  res.statusCode = 418
  res.end()
}))
let base = ''
beforeAll(async () => {
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => {
  server.close()
})

const call = async (path: string, init: RequestInit = {}, token = 'test-token') => {
  const headers = new Headers(init.headers)
  headers.set('x-aurora-token', token)
  const res = await fetch(`${base}${path}`, { ...init, headers })
  return { status: res.status, body: res.status === 204 ? undefined : await res.json() as Record<string, unknown>, headers: res.headers }
}

describe('Studio dev-tool API', () => {
  it('lists the project\'s .aurora files, skipping dependencies, build output and symlinks', async () => {
    const { status, body } = await call('/__aurora/files')
    expect(status).toBe(200)
    expect(body?.['files']).toEqual(['presets/hero.aurora'])
  })

  it('reads a file as authored', async () => {
    expect((await call('/__aurora/file?path=presets/hero.aurora')).body?.['text']).toBe(hero)
  })

  it('writes valid documents and refuses invalid ones', async () => {
    const renamed = hero.replace('Classic hero', 'Renamed')
    expect((await call('/__aurora/file?path=presets/new.aurora', { method: 'PUT', body: renamed })).status).toBe(200)
    expect(readFileSync(join(root, 'presets', 'new.aurora'), 'utf8')).toBe(renamed)
    const bad = await call('/__aurora/file?path=presets/new.aurora', { method: 'PUT', body: hero.replace('"blend"', '"blnd"') })
    expect(bad.status).toBe(422)
    expect(bad.body?.['error']).toBe('Not saved: presets/new.aurora would be invalid.')
    expect(readFileSync(join(root, 'presets', 'new.aurora'), 'utf8')).toBe(renamed)
  })

  it('needs the session token', async () => {
    const { status, body } = await call('/__aurora/files', {}, 'wrong')
    expect(status).toBe(401)
    expect(body?.['error']).toBe('Missing or wrong token. Open Studio from the link your terminal printed.')
  })

  it.each([
    ['../escape.aurora', 403],
    ['/etc/passwd.aurora', 400],
    ['presets/hero.json', 400],
    ['presets/link.aurora', 403],
    ['escape/secret.aurora', 403],
    ['presets/missing.aurora', 404],
  ])('refuses %s', async (path, status) => {
    expect((await call(`/__aurora/file?path=${encodeURIComponent(path)}`)).status).toBe(status)
    if (status !== 404) expect((await call(`/__aurora/file?path=${encodeURIComponent(path)}`, { method: 'PUT', body: hero })).status).toBe(status)
  })

  it('allows Studio and localhost origins only, including private-network preflights', async () => {
    const preflight = await call('/__aurora/files', { method: 'OPTIONS', headers: { origin: 'https://aurora.goatsoft.io' } })
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('access-control-allow-origin')).toBe('https://aurora.goatsoft.io')
    expect(preflight.headers.get('access-control-allow-private-network')).toBe('true')
    expect((await call('/__aurora/files', { headers: { origin: 'http://localhost:5174' } })).status).toBe(200)
    const evil = await call('/__aurora/files', { headers: { origin: 'https://evil.example' } })
    expect(evil.status).toBe(403)
    expect(evil.body?.['error']).toBe('Origin https://evil.example may not use the Aurora Studio API.')
  })

  it('passes other requests through and names unknown routes', async () => {
    expect((await fetch(`${base}/index.html`)).status).toBe(418)
    expect((await call('/__aurora/nope')).body?.['error']).toBe('No GET /__aurora/nope. Studio uses GET files, GET file and PUT file.')
  })

  it('links to Studio with the API and token', () => {
    expect(studioLink('http://localhost:5173/__aurora/', 'abc')).toBe('https://aurora.goatsoft.io/studio/?connect=http%3A%2F%2Flocalhost%3A5173%2F__aurora%2F&token=abc')
  })
})
