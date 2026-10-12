import 'vitest'

declare module 'vitest' {
  interface ProvidedContext {
    /** Absolute path of the repository root, for tests that touch the filesystem. */
    root: string
  }
}
