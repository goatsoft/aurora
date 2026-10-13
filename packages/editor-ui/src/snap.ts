/** Rounds `value` to the nearest multiple of `step`, without float noise (0.1 + 0.2 stays 0.3). */
export function snap(value: number, step: number): number {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step)) + 1)
  return Number((Math.round(value / step) * step).toFixed(decimals))
}
