import type { AuroraModule } from '@goatsoft/aurora'

/** Resolve build-time preset imports with a useful error if a file is renamed. */
export function preset(modules: Record<string, AuroraModule>, id: string, kind: 'scene' | 'starter'): AuroraModule {
  const entry = Object.entries(modules).find(([path]) => path.endsWith(`/${id}.aurora`))
  if (!entry) throw new Error(`Unknown ${kind} preset "${id}"`)
  return entry[1]
}
