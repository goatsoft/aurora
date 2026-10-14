import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

export interface RenderResult {
  html: string
  /** Tags for `<head>`: title, description, canonical, Open Graph. */
  head: string
  /** Attributes for `<html>`, e.g. `lang="en"`. They replace the template's attributes of the same name. */
  htmlAttrs?: string
}

/** A variation axis pinned to one value, or narrowed to a range. */
export type AxisRange = number | { min: number, max: number }

export interface PrerenderOptions {
  /** The client build's folder; its `index.html` is the template. */
  outDir: string
  routes: string[]
  render: (url: string) => Promise<RenderResult>
  /** Also write `404.html` from this route, for static hosts. */
  notFound?: string
  /**
   * Inline the build's own stylesheets as `<style>`, so first paint doesn't wait on another
   * request. Worth it while the CSS is small; external and cross-site sheets stay links.
   */
  inlineCss?: boolean
  /**
   * When the client starts. `eager` (the default) keeps the build's module script and its
   * preloads. `idle` drops the preloads and starts the app once the page has loaded and the
   * browser is idle, or at the first interaction if that comes sooner, so the JavaScript doesn't
   * compete with first paint. The prerendered page works meanwhile (links are links); a button
   * clicked before the app is live is clicked again when the app dispatches `gruff:hydrated` on
   * `window` after mounting. A module script marked `data-eager` still starts at once: use one to
   * get work going before the app, such as warming up a hero background.
   */
  hydrate?: 'eager' | 'idle'
  /**
   * Cut every woff2 font the pages reference down to the characters they use (and printable
   * ASCII, for text that appears later), under a new hashed name. `axes` also narrows variation
   * axes, e.g. `{ wght: { min: 400, max: 700 } }` for a site that only uses those weights.
   */
  subsetFonts?: boolean | { axes?: Record<string, AxisRange> }
}

/** Swaps `<link rel="stylesheet" href="/…">` for the file's contents. */
async function inlineStyles(template: string, outDir: string): Promise<string> {
  const links = [...template.matchAll(/<link rel="stylesheet"(?: crossorigin)? href="(\/[^"/][^"]*\.css)">/g)]
  for (const [tag, href] of links) {
    const css = await readFile(join(outDir, href!), 'utf8')
    template = template.replace(tag, () => `<style>${css.trim().replaceAll('</style', '<\\/style')}</style>`)
  }
  return template
}

/**
 * The classic script that starts the app for `hydrate: 'idle'`: after load and idle, or at the
 * first pointer, key, focus or wheel event. It remembers the first button clicked before then and
 * clicks it again on `gruff:hydrated`.
 */
export function idleLoader(src: string): string {
  const body = `(()=>{const o={capture:!0,passive:!0},e=['pointerdown','keydown','touchstart','focusin','wheel'];let d=0,b;`
    + `const c=(v)=>{b??=v.target.closest?.('button,[role=button]')};`
    + `const go=()=>{if(d)return;d=1;for(const t of e)removeEventListener(t,go,o);import(${JSON.stringify(src)})};`
    + `for(const t of e)addEventListener(t,go,o);addEventListener('click',c,o);`
    + `addEventListener('gruff:hydrated',()=>{removeEventListener('click',c,o);if(b?.isConnected)b.click()},{once:!0});`
    + `const i=()=>'requestIdleCallback' in self?requestIdleCallback(go,{timeout:1500}):setTimeout(go,1);`
    + `document.readyState==='complete'?i():addEventListener('load',i,{once:!0})})()`
  return `<script>${body}</script>`
}

/** Replaces the build's module entry and its preloads with `idleLoader`. Scripts marked `data-eager` stay. */
function deferScripts(template: string): string {
  const entries = [...template.matchAll(/<script type="module"([^>]*)><\/script>/g)].filter(([, attrs]) => !/\sdata-eager\b/.test(attrs!))
  if (entries.length !== 1) throw new Error(`prerender: hydrate 'idle' needs exactly one module script without data-eager in the template, found ${entries.length}.`)
  const [tag, attrs] = entries[0]!
  const src = /\ssrc="([^"]+)"/.exec(attrs!)?.[1]
  if (!src) throw new Error(`prerender: hydrate 'idle' needs the module script to have a src: ${tag}`)
  return template
    .replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
    .replace(tag, () => idleLoader(src))
}

/** `<html>`'s attributes with `extra` added, replacing any of the same name. */
function mergeAttrs(attrs: string, extra: string | undefined): string {
  if (!extra) return attrs
  for (const [, name] of extra.matchAll(/([\w:-]+)=/g)) attrs = attrs.replace(new RegExp(`\\s${name}="[^"]*"`, 'g'), '')
  return `${attrs} ${extra}`
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ' }

/** Every character a page can show: its markup without scripts and styles, entities decoded. */
export function pageCharacters(html: string): Set<string> {
  const text = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code: string) => {
      if (!code.startsWith('#')) return ENTITIES[code.toLowerCase()] ?? entity
      return String.fromCodePoint(/^#x/i.test(code) ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1)))
    })
  return new Set(text)
}

const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('')

/** Subsets each referenced woff2 to `characters` and rewrites `files` to the new names. */
async function subsetFonts(outDir: string, files: string[], characters: Set<string>, axes?: Record<string, AxisRange>): Promise<void> {
  const { default: subset } = await import('subset-font')
  const assets = join(outDir, 'assets')
  const sheets = (await readdir(assets).catch(() => [])).filter((name) => name.endsWith('.css')).map((name) => join(assets, name))
  const targets = [...files, ...sheets]
  const contents = new Map(await Promise.all(targets.map(async (file) => [file, await readFile(file, 'utf8')] as const)))
  const fonts = new Set([...contents.values()].flatMap((text) => [...text.matchAll(/["'(]\/([^"'()\s?#]+\.woff2)/g)].map(([, path]) => path!)))
  const text = [...characters].join('') + ASCII
  for (const path of fonts) {
    const file = join(outDir, path)
    const font = await subset(await readFile(file), text, { targetFormat: 'woff2', ...(axes && { variationAxes: axes }) })
    const hash = createHash('sha256').update(font).digest('base64url').slice(0, 8)
    const name = `${basename(path, '.woff2').replace(/-[\w-]{8}$/, '')}-${hash}.woff2`
    await writeFile(join(dirname(file), name), font)
    if (name !== basename(path)) await rm(file)
    for (const [target, value] of contents) contents.set(target, value.replaceAll(basename(path), name))
  }
  await Promise.all([...contents].map(([file, value]) => writeFile(file, value)))
}

/**
 * Renders every route to static HTML inside the client build: `/docs/guide` →
 * `docs/guide/index.html`. The template's `<!--app-->` and `<!--head-->` are replaced, and the
 * client hydrates the same markup.
 */
export async function prerender(options: PrerenderOptions): Promise<string[]> {
  const { outDir, routes, render, notFound, inlineCss = false, hydrate = 'eager' } = options
  let template = await readFile(join(outDir, 'index.html'), 'utf8')
  if (!template.includes('<!--app-->') || !template.includes('<!--head-->')) {
    throw new Error(`prerender: ${join(outDir, 'index.html')} needs <!--head--> in <head> and <!--app--> inside the app element.`)
  }
  if (inlineCss) template = await inlineStyles(template, outDir)
  if (hydrate === 'idle') template = deferScripts(template)
  const characters = new Set<string>()
  const page = async (url: string) => {
    const { html, head, htmlAttrs } = await render(url)
    for (const c of pageCharacters(html + head)) characters.add(c)
    return template
      .replace('<!--head-->', () => head)
      .replace('<!--app-->', () => html)
      .replace(/<html([^>]*)>/, (_, attrs: string) => `<html${mergeAttrs(attrs, htmlAttrs)}>`)
  }
  const written: string[] = []
  for (const route of routes) {
    const file = join(outDir, route.replace(/^\//, ''), 'index.html')
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, await page(route))
    written.push(file)
  }
  if (notFound !== undefined) {
    const file = join(outDir, '404.html')
    await writeFile(file, await page(notFound))
    written.push(file)
  }
  if (options.subsetFonts) {
    const axes = typeof options.subsetFonts === 'object' ? options.subsetFonts.axes : undefined
    await subsetFonts(outDir, written, characters, axes)
  }
  return written
}
