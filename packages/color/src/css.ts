import { oklabToOklch, oklchToOklab, rgbToOklab } from './oklab'
import type { Oklab, RgbSpace } from './oklab'

export type ColorParseResult = { ok: true, color: Oklab } | { ok: false, message: string }

/** Colour syntaxes accepted in `.aurora` palettes, for error messages and docs. */
export const COLOR_SYNTAX = 'oklch(L C H), oklab(L a b), color(srgb|display-p3 r g b) or #hex'

const HEX = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i
const FUNCTION = /^([a-z-]+)\((.*)\)$/i
const NUMBER = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg)?$/i

const fail = (message: string): ColorParseResult => ({ ok: false, message })

/**
 * Parses a CSS colour in one of the syntaxes `.aurora` palettes accept (CSS Color 4 modern,
 * space-separated form, optional `/ alpha`). Returns OKLab, or a message saying exactly what is wrong.
 */
export function parseColor(input: string): ColorParseResult {
  const text = input.trim()
  if (text.startsWith('#')) return parseHex(text)

  const fn = FUNCTION.exec(text)
  if (!fn) return fail(`"${input}" is not a colour. Use ${COLOR_SYNTAX}.`)
  const name = fn[1]!.toLowerCase()
  const parts = fn[2]!.trim().split(/\s+/)

  let space: RgbSpace | undefined
  if (name === 'color') {
    const id = parts.shift()?.toLowerCase()
    if (id !== 'srgb' && id !== 'display-p3') {
      return fail(`color() supports srgb and display-p3, not "${id ?? ''}".`)
    }
    space = id
  } else if (name !== 'oklch' && name !== 'oklab') {
    return fail(`${name}() is not supported. Use ${COLOR_SYNTAX}.`)
  }

  const slash = parts.indexOf('/')
  const channels = slash === -1 ? parts : parts.slice(0, slash)
  const alphaParts = slash === -1 ? [] : parts.slice(slash + 1)
  const label = name === 'color' ? `color(${space ?? ''})` : `${name}()`
  if (channels.length !== 3 || (slash !== -1 && alphaParts.length !== 1)) {
    return fail(`${label} expects 3 space-separated values and an optional "/ alpha", got "${fn[2]!.trim()}".`)
  }

  const kinds = CHANNELS[name]
  const values: number[] = []
  for (const [i, raw] of channels.entries()) {
    const value = channel(raw, kinds[i]!)
    if (value === undefined) return fail(`${label}: "${raw}" is not a valid value.`)
    values.push(value)
  }
  let alpha = 1
  if (alphaParts.length) {
    const value = channel(alphaParts[0]!, 'alpha')
    if (value === undefined) return fail(`${label}: alpha "${alphaParts[0]!}" is not a valid value.`)
    alpha = Math.min(1, Math.max(0, value))
  }

  const [x, y, z] = values as [number, number, number]
  if (space) return { ok: true, color: rgbToOklab({ r: x, g: y, b: z, alpha }, space) }
  const l = Math.min(1, Math.max(0, x))
  if (name === 'oklab') return { ok: true, color: { l, a: y, b: z, alpha } }
  return { ok: true, color: oklchToOklab({ l, c: Math.max(0, y), h: z, alpha }) }
}

type Channel = 'l' | 'c' | 'h' | 'ab' | 'rgb' | 'alpha'

const CHANNELS = {
  oklch: ['l', 'c', 'h'],
  oklab: ['l', 'ab', 'ab'],
  color: ['rgb', 'rgb', 'rgb'],
} as const satisfies Record<string, readonly Channel[]>

/** Percentages scale per CSS Color 4: L and alpha 100% = 1, chroma and a/b 100% = 0.4. */
const PERCENT: Record<Exclude<Channel, 'h'>, number> = { l: 1, c: 0.4, ab: 0.4, rgb: 1, alpha: 1 }

function channel(raw: string, kind: Channel): number | undefined {
  const match = NUMBER.exec(raw)
  if (!match) return undefined
  const value = Number(match[1])
  const unit = match[2]?.toLowerCase()
  if (unit === 'deg') return kind === 'h' ? value : undefined
  if (unit === '%') return kind === 'h' ? undefined : (value / 100) * PERCENT[kind]
  return value
}

function parseHex(text: string): ColorParseResult {
  if (!HEX.test(text)) return fail(`"${text}" is not a valid hex colour. Use #rgb, #rgba, #rrggbb or #rrggbbaa.`)
  let hex = text.slice(1)
  if (hex.length <= 4) hex = hex.replace(/./g, '$&$&')
  const byte = (i: number) => parseInt(hex.slice(i * 2, i * 2 + 2), 16) / 255
  return { ok: true, color: rgbToOklab({ r: byte(0), g: byte(1), b: byte(2), alpha: hex.length === 8 ? byte(3) : 1 }) }
}

const round = (value: number, digits: number) => Number(value.toFixed(digits))

/** Formats a colour as a canonical `oklch()` string, the form `.aurora` files store. */
export function formatOklch(color: Oklab): string {
  const { l, c, h, alpha } = oklabToOklch(color)
  const body = `${round(l, 4)} ${round(c, 4)} ${round(h, 2)}`
  return alpha < 1 ? `oklch(${body} / ${round(alpha, 4)})` : `oklch(${body})`
}
