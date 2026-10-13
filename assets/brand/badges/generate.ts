import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const labels = { 'made-with': 'Made with Aurora', 'powered-by': 'Powered by Aurora', 'enabled': 'Aurora enabled' } as const
const colors = {
  light: '.panel{fill:#fcfbff}.line{stroke:#d9d5e7}.ink{fill:#262139}.muted{fill:#655c79}',
  dark: '.panel{fill:#141421}.line{stroke:#3a364f}.ink{fill:#f4f0ff}.muted{fill:#b7b0cc}',
}

/** Generate build assets from one badge template and the approved favicon artwork. */
export function generateBadges(root: string) {
  const directory = join(root, 'assets/brand/badges')
  const template = readFileSync(join(directory, 'badge.svg'), 'utf8')
  const output = join(directory, 'v1')
  mkdirSync(output, { recursive: true })
  const files = new Map<string, string>()
  for (const layout of ['inline', 'stacked'] as const) {
    for (const key of Object.keys(labels) as (keyof typeof labels)[]) {
      for (const theme of ['auto', 'light', 'dark'] as const) {
        for (const animated of [false, true]) {
          const inline = layout === 'inline'
          const enabled = key === 'enabled'
          const width = inline ? { 'made-with': 148, 'powered-by': 160, 'enabled': 140 }[key] : 168
          const height = inline ? 32 : 48
          const prefix = key === 'made-with' ? 'Made with' : 'Powered by'
          const name = `${key}${inline ? '-inline' : ''}-${theme}${animated ? '-animated' : ''}.svg`
          const favicon = readFileSync(join(root, `assets/brand/favicon-${theme === 'dark' ? 'dark' : 'light'}.svg`), 'utf8')
          const artwork = favicon.slice(favicon.indexOf('>') + 1, favicon.lastIndexOf('</svg>')).trim()
          const mark = `<svg x="${inline ? 8 : 10}" y="${inline ? 6 : 8}" width="${inline ? 20 : 32}" height="${inline ? 20 : 32}" viewBox="0 0 128 128" fill="none" aria-hidden="true">${artwork}</svg>`
          let css = colors[theme === 'dark' ? 'dark' : 'light']
          if (theme === 'auto') css += `@media(prefers-color-scheme:dark){${colors.dark}.s0{stop-color:#43f4dc}.s1{stop-color:#8c83ff}.s2{stop-color:#ee82ed}.e0{stop-color:#43f4dc}.e1{stop-color:#8c83ff}.e2{stop-color:#ee82ed}}`
          if (animated) css += '.orbit{stroke-dasharray:24 76;stroke-linecap:round}.orbit-echo{stroke-dashoffset:-50;opacity:.6}@media(prefers-reduced-motion:no-preference){.orbit{animation:aurora-orbit 6s linear infinite}.orbit-echo{stroke-dashoffset:0;animation-delay:-3s}.breathe{animation:aurora-breathe 3s ease-in-out infinite}}@keyframes aurora-orbit{to{stroke-dashoffset:-100}}@keyframes aurora-breathe{0%,100%{opacity:.45}50%{opacity:.8}}'
          const text = inline
            ? `<text x="36" y="20.5">${enabled ? '<tspan class="ink" font-size="12" font-weight="600">Aurora</tspan><tspan class="muted" dx="4" font-size="10.5">enabled</tspan>' : `<tspan class="muted" font-size="10.5">${prefix}</tspan><tspan class="ink" dx="4" font-size="12" font-weight="600">Aurora</tspan>`}</text>`
            : enabled
              ? '<text class="ink" x="50" y="23" font-size="16" font-weight="600" letter-spacing="-.4">Aurora</text><text class="muted" x="51" y="37" font-size="10">enabled</text>'
              : `<text class="muted" x="51" y="20" font-size="10">${prefix}</text><text class="ink" x="50" y="36" font-size="16" font-weight="600" letter-spacing="-.4">Aurora</text>`
          const edge = (blurred: boolean) => `<rect class="orbit" x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="${inline ? 8 : 11}" pathLength="100" fill="none" stroke="url(#edge)" stroke-width="${blurred ? 4 : 1.5}"${blurred ? ' filter="url(#glow)"' : ''}/><rect class="orbit orbit-echo" x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="${inline ? 8 : 11}" pathLength="100" fill="none" stroke="url(#edge)" stroke-width="${blurred ? 4 : 1.5}"${blurred ? ' filter="url(#glow)"' : ''}/>`
          const values: Record<string, string | number> = {
            label: labels[key], width, height, css, mark, text,
            haloOpacity: animated ? 0.55 : 0.24,
            edge0: animated && theme !== 'dark' ? '#007f91' : '#43f4dc',
            edge1: animated && theme !== 'dark' ? '#5145cd' : '#8c83ff',
            edge2: animated && theme !== 'dark' ? '#a72fa6' : '#ee82ed',
            animatedEdge: animated ? edge(true) + edge(false) : '',
            panelWidth: width - 1, panelHeight: height - 1, radius: inline ? 9 : 12,
            glowWidth: width - 6, glowHeight: height - 6, glowRadius: inline ? 7 : 10,
            arrow: inline ? '' : '<path class="line" d="m145 20 4 4-4 4m-5-4h9" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
          }
          const svg = template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
            const value = values[key]
            if (value === undefined) throw new Error(`Unknown badge template field: ${key}`)
            return String(value)
          })
          writeFileSync(join(output, name), svg)
          files.set(`/badges/v1/${name}`, svg)
        }
      }
    }
  }
  return files
}
