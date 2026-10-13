/** Optional attribution: pure data, no DOM, GPU runtime, artwork or network requests. */
export type BadgeLabel = 'made-with' | 'powered-by' | 'enabled'
export type BadgeLayout = 'inline' | 'stacked'
export type BadgeTheme = 'auto' | 'light' | 'dark'

export interface BadgeOptions {
  label?: BadgeLabel | undefined
  /** Compact single-line badge by default; stacked preserves the original card. */
  layout?: BadgeLayout | undefined
  theme?: BadgeTheme | undefined
  /** A slow glow around the badge; the SVG honours prefers-reduced-motion. */
  animated?: boolean | undefined
  /** Directory of unmodified official badge SVGs, for self-hosting. */
  baseUrl?: string | undefined
}

const labels = {
  'made-with': 'Made with Aurora',
  'powered-by': 'Powered by Aurora',
  'enabled': 'Aurora enabled',
} as const

/** Embed the returned image in a link to `href`. Static and adaptive by default. */
export function auroraBadge(options: BadgeOptions = {}) {
  const { label = 'made-with', theme = 'auto', layout = 'inline', animated = false, baseUrl = 'https://aurora.goatsoft.io/badges/v1' } = options
  return {
    href: 'https://aurora.goatsoft.io/',
    src: `${baseUrl.replace(/\/+$/, '')}/${label}${layout === 'inline' ? '-inline' : ''}-${theme}${animated ? '-animated' : ''}.svg`,
    alt: labels[label],
    width: layout === 'stacked' ? 168 : { 'made-with': 148, 'powered-by': 160, 'enabled': 140 }[label],
    height: layout === 'stacked' ? 48 : 32,
  } as const
}
