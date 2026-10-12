import type { Oklab } from '@goatsoft/color'
import type { NoiseModule } from './noise'

/** A numeric generator parameter. Studio builds its inspector controls from these. */
export interface ParamSpec {
  default: number
  min: number
  max: number
  /** Snap increment for sliders and keyboard nudges (shift = ×10). */
  step: number
  label: string
  description: string
  unit?: string
  /** Control hint: `seed` shows a shuffle button, `toggle` a switch for 0/1. */
  ui?: 'slider' | 'seed' | 'toggle'
}

/** What a generator's CSS fallback is given: palette colours (gamut-mapped OKLab) and resolved params. */
export interface CssContext<P extends string> {
  colors: readonly Oklab[]
  params: Readonly<Record<P, number>>
  /** CSS colour interpolation for this layer: "oklab" or "srgb". */
  space: 'oklab' | 'srgb'
  /** Layer opacity, to fold into colour alphas. */
  opacity: number
}

export interface Generator<P extends string = string> {
  /** Kebab-case id used as the layer `type`. */
  id: string
  label: string
  description: string
  /** How many palette colours the generator reads, in order. */
  colors: number
  /** A palette that shows the generator at its best: Studio's starting colours and the starter preset. */
  palette: readonly string[]
  /** Shared noise modules the WGSL calls (`noise_simplex`, `noise_fbm`, …). */
  requires?: readonly NoiseModule[]
  /** Parameters, in uniform order. */
  params: Readonly<Record<P, ParamSpec>>
  /**
   * WGSL defining `fn render(ctx: Ctx, p: Params, c: array<vec3f, N>) -> vec4f`, returning straight
   * (not premultiplied) colour in the layer's mix space, and alpha. `Ctx` has `uv` (scene space,
   * y down), `res` (scene size in pixels), `time` (seconds × motion speed) and `scroll`. Every `fn`
   * is namespaced by the composer, so helpers can use plain names.
   */
  wgsl: string
  /** CSS `<image>` values approximating the generator for the CSS fallback, bottom layer last. */
  css: (context: CssContext<P>) => string[]
}

/** Everything the GPU side needs: a generator without its CSS function, so it can be posted to the worker. */
export type GeneratorSpec<P extends string = string> = Omit<Generator<P>, 'css'>

/** Finds a generator by id. */
export type GeneratorLookup = (id: string) => GeneratorSpec | undefined

/** The serialisable part of a generator. */
export function generatorSpec({ css: _, ...spec }: Generator): GeneratorSpec {
  return spec
}

/** Declares a generator with its parameter names inferred, for type-safe `css` callbacks. */
export function defineGenerator<const P extends string>(generator: Generator<P>): Generator<P> {
  return generator
}
