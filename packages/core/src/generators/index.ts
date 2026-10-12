import { auroraFbm } from './aurora-fbm'
import type { Generator } from './define'

export { auroraFbm }

/** The flagship ships eagerly; every other built-in is its own chunk, loaded the first time a document uses it. */
const BUILTIN: Readonly<Record<string, () => Promise<Generator>>> = {
  'mesh-gradient': () => import('./mesh-gradient').then((m) => m.meshGradient as Generator),
  'linear-sweep': () => import('./linear-sweep').then((m) => m.linearSweep as Generator),
  'conic': () => import('./conic').then((m) => m.conic as Generator),
  'grain': () => import('./grain').then((m) => m.grain as Generator),
  'strata': () => import('./strata').then((m) => m.strata as Generator),
  'wind': () => import('./wind').then((m) => m.wind as Generator),
  'fire': () => import('./fire').then((m) => m.fire as Generator),
  'water': () => import('./water').then((m) => m.water as Generator),
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
  await Promise.all([...new Set(ids)].map(async (id) => {
    const load = BUILTIN[id]
    if (!registry[id] && load) registry[id] = await load()
  }))
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
