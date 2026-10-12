import type { MarkdownIt } from 'markdown-it'
import { dirname, posix, relative, resolve } from 'node:path'

export interface LinkOptions {
  /** The repository root: `/packages/…` in a page means this folder. */
  root: string
  /** The route for a Markdown file, or undefined when it isn't a page of the site. */
  route: (file: string) => string | undefined
  /** Where links to files that aren't pages go, e.g. `https://github.com/org/repo/blob/main/`. */
  repoUrl: string
}

const EXTERNAL = /^[a-z][a-z\d+.-]*:/i

/**
 * Links and images resolve the way they do on GitHub, so the same Markdown reads well in both:
 * - `guide.md#setup` → that page's route; a `.md` that isn't a page → the file on GitHub;
 * - `/packages/core/test/golden/fire.png` (repo-absolute) and `./x.png` → bundled by Vite;
 * - other sites open in a new tab.
 */
export function links(md: MarkdownIt, options: LinkOptions): void {
  const page = (env: unknown) => (env as { id?: string }).id ?? ''

  const open = md.renderer.rules['link_open'] ?? ((tokens, idx, opts, _env, self) => self.renderToken(tokens, idx, opts))
  md.renderer.rules['link_open'] = (tokens, idx, opts, env, self) => {
    const token = tokens[idx]!
    const href = String(token.attrGet('href') ?? '')
    if (EXTERNAL.test(href)) {
      if (!href.startsWith('mailto:')) {
        token.attrSet('target', '_blank')
        token.attrSet('rel', 'noopener')
      }
    } else if (!href.startsWith('#') && href) {
      const [path = '', hash] = href.split('#', 2)
      const file = path.startsWith('/') ? resolve(options.root, `.${path}`) : resolve(dirname(page(env)), path)
      const route = path.endsWith('.md') ? options.route(file) : undefined
      const target = route ?? (path.endsWith('/') || !path ? undefined : `${options.repoUrl}${relative(options.root, file).split('\\').join('/')}`)
      if (target) token.attrSet('href', `${target}${hash ? `#${hash}` : ''}`)
      if (!route && target) {
        token.attrSet('target', '_blank')
        token.attrSet('rel', 'noopener')
      }
    }
    return open(tokens, idx, opts, env, self)
  }

  // Vue compiles `src` attributes that start with `.` into imports, so the bundler hashes them.
  const image = md.renderer.rules['image']!
  md.renderer.rules['image'] = (tokens, idx, opts, env, self) => {
    const token = tokens[idx]!
    const src = String(token.attrGet('src') ?? '')
    if (src.startsWith('/') && !src.startsWith('//')) {
      const rel = posix.normalize(relative(dirname(page(env)), resolve(options.root, `.${src}`)).split('\\').join('/'))
      token.attrSet('src', rel.startsWith('.') ? rel : `./${rel}`)
    }
    token.attrSet('loading', 'lazy')
    token.attrSet('decoding', 'async')
    return image(tokens, idx, opts, env, self)
  }
}
