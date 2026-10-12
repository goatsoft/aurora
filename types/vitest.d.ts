import 'vitest'

declare module 'vitest' {
  interface ProvidedContext {
    /** Absolute path of the repository root, for tests that touch the filesystem. */
    root: string
    /** Rewrite golden images instead of comparing (`UPDATE_GOLDEN=1`). */
    updateGolden: boolean
    /** Running in CI: a missing golden is a failure, not a new file. */
    ci: boolean
  }
}
