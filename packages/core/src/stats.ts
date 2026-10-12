import type { RendererStats } from './protocol'
import { getBackendsForStats } from './surface'

/** Renderer statistics for a perf HUD: surfaces, batches submitted and the last batch's time. */
export async function auroraStats(): Promise<RendererStats | undefined> {
  const { worker, main } = getBackendsForStats()
  return (await worker.stats()) ?? (await main.stats())
}
