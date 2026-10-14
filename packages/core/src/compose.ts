import type { GeneratorLookup, GeneratorSpec } from './generators/define'
import type { NoiseModule } from './generators/noise'
import type { AuroraDocument, AuroraLayer } from '@goatsoft/aurora-format'
import type { RgbSpace } from '@goatsoft/color'
import { COLOR_WGSL } from '@goatsoft/color'
import { noiseWgsl } from './generators/noise'
import { signalWgsl } from './signal'
import { STD_WGSL } from './wgsl-std'

/** Where each layer's values live in the uniform array, in vec4 slots. */
export interface LayerLayout {
  generator: GeneratorSpec
  /** Slot of `[opacity, param0, param1, …]`, continuing over as many slots as needed. */
  params: number
  /** Slot of the mask's four values, if the layer has a mask. */
  mask?: number
  /** First of `generator.colors` consecutive colour slots. */
  colors: number
}

export interface ComposedShader {
  /** Identifies everything that changes the WGSL; values that only change uniforms are excluded. */
  key: string
  code: string
  /** Uniform array length in vec4 slots. Slots 0–1 are the frame: `[res, time, scroll]`, `[scene rect]`. */
  slots: number
  layers: LayerLayout[]
  output: RgbSpace
  signal?: number
  pixelate?: number
  vignette?: number
}

const FRAME_SLOTS = 2
const COMPONENT = ['x', 'y', 'z', 'w'] as const

/** WGSL reference to scalar `index` of the flat uniform array. */
const scalar = (index: number) => `U.v[${Math.floor(index / 4)}].${COMPONENT[index % 4]!}`

/** Generator code with every `fn`, `const` and `Params` namespaced, so generators can't collide. */
function namespaced(generator: GeneratorSpec, prefix: string): string {
  const names = [...generator.wgsl.matchAll(/\b(?:fn|const)\s+(\w+)/g)].map((m) => m[1]!)
  const pattern = new RegExp(`\\b(${[...names, 'Params'].join('|')})\\b`, 'g')
  return generator.wgsl.replace(pattern, `${prefix}$1`)
}

function paramsStruct(generator: GeneratorSpec, prefix: string): string {
  const fields = Object.keys(generator.params).map((name) => `${name}: f32`)
  return `struct ${prefix}Params { ${fields.join(', ')} };`
}

function toOutput(layer: AuroraLayer, output: RgbSpace, rgb: string): string {
  if (layer.mix === 'oklab') {
    return output === 'srgb'
      ? `color_srgb_encode(color_oklab_to_linear_srgb(${rgb}))`
      : `color_srgb_encode(color_oklab_to_linear_p3(${rgb}))`
  }
  return output === 'srgb' ? rgb : `color_srgb_encode(color_linear_srgb_to_linear_p3(color_srgb_decode(${rgb})))`
}

function maskExpression(layer: AuroraLayer, slot: number): string {
  const m = `U.v[${slot}]`
  if (layer.mask!.type === 'linear') {
    // [sin(angle), -cos(angle), start, end]: CSS angles, measured along the gradient line of the box.
    return `(1.0 - smoothstep(${m}.z, ${m}.w, dot(suv - 0.5, ${m}.xy) / (abs(${m}.x) + abs(${m}.y)) + 0.5))`
  }
  // [x, y, start, end]: distance from the centre over the half-diagonal, aspect-corrected.
  return `(1.0 - smoothstep(${m}.z, ${m}.w, length((suv - ${m}.xy) * vec2f(aspect, 1.0)) / (0.5 * length(vec2f(aspect, 1.0)))))`
}

const FADE: Record<AuroraDocument['canvas']['fade'], string | undefined> = {
  none: undefined,
  y: 'smoothstep(0.0, 0.22, suv.y) * (1.0 - smoothstep(0.78, 1.0, suv.y))',
  x: 'smoothstep(0.0, 0.22, suv.x) * (1.0 - smoothstep(0.78, 1.0, suv.x))',
}

/** The parts of a document that change the shader's code. */
export function shaderKey(doc: AuroraDocument, output: RgbSpace): string {
  const layers = doc.layers.map((l) => [l.type, l.blend, l.mix, l.mask?.type ?? '-'].join(':'))
  return [output, doc.canvas.fade, ...layers, ...(['signal', 'pixelate', 'vignette'] as const).filter((name) => !!doc.modifiers?.[name])].join('|')
}

const cache = new Map<string, ComposedShader>()

/**
 * Composes one WGSL shader for a document's layer stack. Layers are rendered bottom first and
 * composited as premultiplied colour in the output space, like CSS blending. Results are cached by
 * `shaderKey`, so documents that differ only in values share a shader and a pipeline.
 */
export function compose(doc: AuroraDocument, output: RgbSpace, lookup: GeneratorLookup): ComposedShader {
  const key = shaderKey(doc, output)
  const cached = cache.get(key)
  if (cached) return cached

  const modules = new Map<string, string>()
  const noise = new Set<NoiseModule>()
  const layers: LayerLayout[] = []
  const body: string[] = []
  let slot = FRAME_SLOTS

  doc.layers.forEach((layer, i) => {
    const generator = lookup(layer.type)
    if (!generator) throw new Error(`Unknown generator "${layer.type}". Validate documents with validateDocument() first.`)
    const prefix = `${generator.id.replace(/-/g, '_')}_`
    if (!modules.has(generator.id)) modules.set(generator.id, `${paramsStruct(generator, prefix)}\n${namespaced(generator, prefix)}`)
    for (const name of generator.requires ?? []) noise.add(name)

    const names = Object.keys(generator.params)
    const params = slot
    slot += Math.ceil((names.length + 1) / 4)
    const mask = layer.mask ? slot++ : undefined
    const colors = slot
    slot += generator.colors
    layers.push(mask === undefined ? { generator, params, colors } : { generator, params, mask, colors })

    const base = params * 4
    const args = names.map((_, k) => scalar(base + 1 + k)).join(', ')
    const palette = Array.from({ length: generator.colors }, (_, k) => `U.v[${colors + k}].xyz`).join(', ')
    const alpha = [`s.a * ${scalar(base)}`, ...(mask === undefined ? [] : [maskExpression(layer, mask)])].join(' * ')
    body.push(`  {
    // Layer ${i}: ${layer.type}, ${layer.blend}, mixed in ${layer.mix}
    let s = ${prefix}render(ctx, ${prefix}Params(${args}), array<vec3f, ${generator.colors}>(${palette}));
    let a = ${alpha};
    acc = blend_${layer.blend}(vec4f(${toOutput(layer, output, 's.rgb')} * a, a), acc);
  }`)
  })

  const signal = doc.modifiers?.signal ? slot : undefined
  if (signal !== undefined) {
    slot += 2
    noise.add('hash')
  }
  const pixelate = doc.modifiers?.pixelate ? slot++ : undefined
  const vignette = doc.modifiers?.vignette ? slot++ : undefined
  const modified = signal !== undefined || pixelate !== undefined || vignette !== undefined
  const effect = !modified
    ? ''
    : `
fn _aurora_signal_scene(ctx: Ctx, suv: vec2f, aspect: f32) -> vec4f {
  var acc = vec4f(0.0);
${body.join('\n')}
  return acc;
}
${signalWgsl(signal, pixelate)}`
  const fade = FADE[doc.canvas.fade]
  const code = `${STD_WGSL}${COLOR_WGSL}
struct Uniforms { v: array<vec4f, ${slot}> };
@group(0) @binding(0) var<uniform> U: Uniforms;
${noiseWgsl(noise)}${[...modules.values()].join('\n')}${effect}
@fragment fn fs(in: VOut) -> @location(0) vec4f {
  let suv = vec2f(in.uv.x, 1.0 - in.uv.y);
  let aspect = (U.v[0].x * U.v[1].z) / (U.v[0].y * U.v[1].w);
  var ctx: Ctx;
  ctx.uv = U.v[1].xy + suv * U.v[1].zw;
  ctx.res = U.v[0].xy;
  ctx.time = U.v[0].z;
  ctx.scroll = U.v[0].w;
${!modified ? `  var acc = vec4f(0.0);\n${body.join('\n')}` : `  var acc = ${signal === undefined ? '_aurora_signal_sample' : '_aurora_signal_render'}(ctx.uv);`}
${vignette === undefined
  ? ''
  : `  let v = U.v[${vignette}];
  let radius = length((ctx.uv - 0.5) * ctx.res / min(ctx.res.x, ctx.res.y));
  let shade = 1.0 - v.x * smoothstep(v.y, v.y + v.z, radius);
  if (v.x > 0.0 && acc.a > 0.0) { acc = vec4f(color_srgb_encode(color_srgb_decode(acc.rgb / acc.a) * shade) * acc.a, acc.a); }
`}${fade ? `  acc *= ${fade};\n` : ''}  return acc;
}
`
  const shader: ComposedShader = { key, code, slots: slot, layers, output, ...(signal === undefined ? {} : { signal }), ...(pixelate === undefined ? {} : { pixelate }), ...(vignette === undefined ? {} : { vignette }) }
  cache.set(key, shader)
  return shader
}
