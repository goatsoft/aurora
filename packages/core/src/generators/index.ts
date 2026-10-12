import type { Generator } from './define'
import { auroraFbm } from './aurora-fbm'

export { auroraFbm }

const registry: Record<string, Generator> = { [auroraFbm.id]: auroraFbm }

/** Generators by id: the built-ins plus any registered with `registerGenerator`. */
export const GENERATORS: Readonly<Record<string, Generator>> = registry

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
