import type { ComposedShader } from './compose'
import type { GeneratorSpec } from './generators/define'
import type { AuroraDocument, AuroraLayer } from '@goatsoft/aurora-format'
import type { Oklab, RgbSpace } from '@goatsoft/color'
import { gamutMap, parseColor, rgbToOklab } from '@goatsoft/color'

/** Per-frame inputs. Sizes are in device pixels of the whole scene (just the surface when alone). */
export interface FrameState {
  width: number
  height: number
  /** Seconds since the scene's clock started; frozen for reduced motion. */
  time: number
  /** Scroll offset in surface heights, already multiplied by parallax. */
  scroll: number
  /** The surface's rectangle inside its scene, in scene UV: `[x, y, width, height]`. */
  rect?: readonly [number, number, number, number]
}

const FULL = [0, 0, 1, 1] as const

/** Palette indices a layer reads: its `colors`, cycled to the generator's count, or the palette in order. */
export function colorIndices(layer: AuroraLayer, generator: GeneratorSpec, paletteSize: number): number[] {
  const source = layer.colors.length ? layer.colors : Array.from({ length: paletteSize }, (_, i) => i)
  return Array.from({ length: generator.colors }, (_, k) => source[k % source.length]!)
}

/** A parameter's value from the layer, or the generator default. Booleans count as 0 or 1. */
export function paramValue(layer: AuroraLayer, generator: GeneratorSpec, name: string): number {
  const value = layer.params[name]
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  return generator.params[name]!.default
}

const parsed = new Map<string, Oklab>()
function oklab(color: string): Oklab {
  let lab = parsed.get(color)
  if (!lab) {
    const result = parseColor(color)
    if (!result.ok) throw new Error(result.message)
    lab = result.color
    parsed.set(color, lab)
  }
  return lab
}

/**
 * A palette colour as the shader wants it: gamma-encoded sRGB for `mix: "srgb"` (exact, for GOAT
 * parity), or OKLab gamut-mapped into the output space for `mix: "oklab"`.
 */
export function shaderColor(color: string, mix: AuroraLayer['mix'], output: RgbSpace): [number, number, number] {
  const lab = oklab(color)
  if (mix === 'srgb') {
    const { r, g, b } = gamutMap(lab, 'srgb')
    return [r, g, b]
  }
  const mapped = rgbToOklab(gamutMap(lab, output), output)
  return [mapped.l, mapped.a, mapped.b]
}

/** Fills the uniform array for one surface and frame. Reuses `out` when it is the right size. */
export function packUniforms(
  doc: AuroraDocument,
  shader: ComposedShader,
  frame: FrameState,
  out?: Float32Array<ArrayBuffer>,
): Float32Array<ArrayBuffer> {
  const u = out?.length === shader.slots * 4 ? out : new Float32Array(shader.slots * 4)
  const rect = frame.rect ?? FULL
  u.set([frame.width, frame.height, frame.time * doc.motion.speed, frame.scroll, ...rect], 0)

  shader.layers.forEach(({ generator, params, mask, colors }, i) => {
    const layer = doc.layers[i]!
    const names = Object.keys(generator.params)
    u.set([layer.opacity, ...names.map((name) => paramValue(layer, generator, name))], params * 4)
    if (mask !== undefined) {
      const m = layer.mask!
      if (m.type === 'linear') {
        const angle = (m.angle * Math.PI) / 180
        u.set([Math.sin(angle), -Math.cos(angle), m.start, m.end], mask * 4)
      } else {
        u.set([m.x, m.y, m.start, m.end], mask * 4)
      }
    }
    colorIndices(layer, generator, doc.palette.length).forEach((index, k) => {
      u.set(shaderColor(doc.palette[index]!, layer.mix, shader.output), (colors + k) * 4)
    })
  })
  return u
}
