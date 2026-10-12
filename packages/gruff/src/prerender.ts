import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export interface RenderResult {
  html: string
  /** Tags for `<head>`: title, description, canonical, Open Graph. */
  head: string
  /** Attributes for `<html>`, e.g. `lang="en"`. */
  htmlAttrs?: string
}

export interface PrerenderOptions {
  /** The client build's folder; its `index.html` is the template. */
  outDir: string
  routes: string[]
  render: (url: string) => Promise<RenderResult>
  /** Also write `404.html` from this route, for static hosts. */
  notFound?: string
}

/**
 * Renders every route to static HTML inside the client build: `/docs/guide` →
 * `docs/guide/index.html`. The template's `<!--app-->` and `<!--head-->` are replaced, and the
 * client hydrates the same markup.
 */
export async function prerender({ outDir, routes, render, notFound }: PrerenderOptions): Promise<string[]> {
  const template = await readFile(join(outDir, 'index.html'), 'utf8')
  if (!template.includes('<!--app-->') || !template.includes('<!--head-->')) {
    throw new Error(`prerender: ${join(outDir, 'index.html')} needs <!--head--> in <head> and <!--app--> inside the app element.`)
  }
  const page = async (url: string) => {
    const { html, head, htmlAttrs } = await render(url)
    return template
      .replace('<!--head-->', head)
      .replace('<!--app-->', html)
      .replace(/<html([^>]*)>/, (_, attrs: string) => `<html${attrs}${htmlAttrs ? ` ${htmlAttrs}` : ''}>`)
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
  return written
}
