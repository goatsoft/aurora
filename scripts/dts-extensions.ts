/**
 * Run from a package after `tsc` emits its declarations: adds the file extensions that
 * `moduleResolution: node16` / `nodenext` needs to relative imports in `dist/**\/*.d.ts`
 * (`'./surface'` becomes `'./surface.js'`, `'./generators'` becomes `'./generators/index.js'`,
 * `'./AuroraScene.vue'` becomes `'./AuroraScene.vue.js'`). Sources keep extensionless imports;
 * bundler resolution already handles both.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const dist = resolve(process.cwd(), 'dist')
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g

function declarations(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return declarations(path)
    return path.endsWith('.d.ts') ? [path] : []
  })
}

for (const file of declarations(dist)) {
  const source = readFileSync(file, 'utf8')
  const fixed = source.replace(SPECIFIER, (match, prefix: string, quote: string, specifier: string) => {
    if (/\.(?:js|json)$/.test(specifier)) return match
    const target = resolve(dirname(file), specifier)
    if (existsSync(`${target}.d.ts`)) return `${prefix}${quote}${specifier}.js${quote}`
    if (existsSync(join(target, 'index.d.ts'))) return `${prefix}${quote}${specifier}/index.js${quote}`
    // Not a declaration (an example in a doc comment, say): leave it. `pnpm consumers` runs
    // arethetypeswrong, which reports any real import this leaves unresolved.
    return match
  })
  if (fixed !== source) writeFileSync(file, fixed)
}
