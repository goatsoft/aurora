import * as v from 'valibot'

export const range = (min: number, max: number, description: string) =>
  v.pipe(
    v.number(),
    v.minValue(min, `must be between ${min} and ${max}`),
    v.maxValue(max, `must be between ${min} and ${max}`),
    v.description(description),
  )
