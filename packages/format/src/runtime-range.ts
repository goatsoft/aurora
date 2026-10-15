// Generated from range.ts; metadata stays in the authoring schema. Regenerate with pnpm test -u.
import * as v from 'valibot'
export const range = (min: number, max: number) => v.pipe(v.number(), v.minValue(min, `must be between ${min} and ${max}`), v.maxValue(max, `must be between ${min} and ${max}`))
