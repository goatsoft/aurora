import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

function isWorkspaceRoot(dir: string): boolean {
  if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return true
  const manifest = join(dir, 'package.json')
  if (!existsSync(manifest)) return false
  return 'workspaces' in (JSON.parse(readFileSync(manifest, 'utf8')) as object)
}

/**
 * The monorepo root above `dir` (pnpm, npm, Yarn or Bun workspaces), or `dir` itself. Module ids
 * are relative to it, so the same file has the same id in every app, and ids never climb with `../`.
 */
export function workspaceRoot(dir: string): string {
  for (let current = dir; ; current = dirname(current)) {
    if (isWorkspaceRoot(current)) return current
    if (dirname(current) === current) return dir
  }
}
