import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { beforeAll, describe, expect, it } from 'vitest'

interface Result { html: string, code: string, root: string }
let result: Result

beforeAll(async () => {
  const { stdout } = await promisify(execFile)(process.execPath, [resolve(import.meta.dirname, 'check.ts')], {
    maxBuffer: 64 * 1024 * 1024,
    // A real build runs with NODE_ENV=production; Vitest's "test" would leave Vue dev annotations in.
    env: { ...process.env, NODE_ENV: 'production' },
  })
  result = JSON.parse(stdout) as Result
}, 60_000)

describe('sample app (PLAN.md Phase 3)', () => {
  it('server-renders every background with its CSS fallback inlined, so nothing flashes', () => {
    const { html } = result
    expect(html.match(/class="aurora-background"/g)).toHaveLength(4)
    expect(html.match(/data-aurora-ssr/g)).toHaveLength(4)
    expect(html.match(/background-image:radial-gradient\(/g)).toHaveLength(4)
    expect(html).toMatch(/<span [^>]*>css<\/span>/)
  })

  it('builds for the browser with the .aurora files compiled in, and no absolute paths', () => {
    expect(result.code).toContain('GOAT hero')
    expect(result.code).toContain('GOAT pillar, violet')
    expect(result.code).not.toContain(result.root)
  })
})
