import type { Generator } from './define'
import { auroraFbm } from './aurora-fbm'

export { auroraFbm }

/** The flagship ships eagerly; every other built-in is its own chunk, loaded the first time a document uses it. */
const BUILTIN: Readonly<Record<string, () => Promise<Generator>>> = {
  'mesh-gradient': () => import('./mesh-gradient').then((m) => m.meshGradient as Generator),
  'linear-sweep': () => import('./linear-sweep').then((m) => m.linearSweep as Generator),
  'conic': () => import('./conic').then((m) => m.conic as Generator),
  'grain': () => import('./grain').then((m) => m.grain as Generator),
  'strata': () => import('./strata').then((m) => m.strata as Generator),
  'mountains': () => import('./mountains').then((m) => m.mountains as Generator),
  'clouds': () => import('./clouds').then((m) => m.clouds as Generator),
  'wind': () => import('./wind').then((m) => m.wind as Generator),
  'fire': () => import('./fire').then((m) => m.fire as Generator),
  'water': () => import('./water').then((m) => m.water as Generator),
  'starfield': () => import('./starfield').then((m) => m.starfield as Generator),
}

const registry: Record<string, Generator> = { [auroraFbm.id]: auroraFbm }

/** Generators loaded so far, by id: `aurora-fbm`, any built-ins documents have used, and registered ones. */
export const GENERATORS: Readonly<Record<string, Generator>> = registry

/** Every generator id a document may use: built-ins (loaded or not) and registered ones. */
export function generatorIds(): string[] {
  return [...new Set([auroraFbm.id, ...Object.keys(BUILTIN), ...Object.keys(registry)])]
}

/** Loads the given built-in generators (all of them by default). Unknown ids are ignored. */
export async function loadGenerators(ids: Iterable<string> = Object.keys(BUILTIN)): Promise<void> {
  const wanted = new Set(ids)
  const missing = Object.keys(BUILTIN).filter((id) => wanted.has(id) && !registry[id])
  const loaded = await Promise.all(missing.map((id) => BUILTIN[id]!()))
  // Register in catalogue order, whatever order the chunks arrived in, so listings are stable.
  missing.forEach((id, i) => {
    registry[id] ??= loaded[i]!
  })
}

const ID = /^[a-z][a-z\d]*(?:-[a-z\d]+)*$/

/**
 * Adds a generator written in code. `.aurora` files can then use it as a layer `type`.
 * Files themselves never carry WGSL; generators only come from code you ship.
 */
export function registerGenerator(generator: Generator): void {
  if (!ID.test(generator.id)) throw new Error(`Generator id "${generator.id}" must be kebab-case, like "aurora-fbm".`)
  if (registry[generator.id] && registry[generator.id] !== generator) {
    throw new Error(`A different generator is already registered as "${generator.id}".`)
  }
  if (!/\bfn\s+render\s*\(/.test(generator.wgsl)) throw new Error(`Generator "${generator.id}" must define fn render(ctx: Ctx, P: Params, c: array<vec3f, N>) -> vec4f.`)
  registry[generator.id] = generator
}
