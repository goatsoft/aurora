import type { GeneratorSpec } from './generators/define'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import type { RgbSpace } from '@goatsoft/color'

/** Everything a renderer needs to draw one surface. Sent on attach and on every change. */
export interface SurfaceState {
  doc: AuroraDocument
  /** Canvas size in device pixels. */
  width: number
  height: number
  /** The scene this surface is part of: its size in the same pixels, and this surface's rect in it. */
  scene: { width: number, height: number, rect: readonly [number, number, number, number] }
  /** Scroll in surface heights × parallax. */
  scroll: number
  visible: boolean
  /** Reduced-motion behaviour in effect, or false for full motion. */
  reduced: false | 'still' | 'slow'
  /** Clock origin, epoch milliseconds. Surfaces in one scene share it. */
  origin: number
  /** Frozen epoch time while explicitly paused; omitted while playing. */
  pausedAt?: number
  output: RgbSpace
}

export type WorkerRequest
  = | { type: 'probe', fps: number }
    | { type: 'register', generator: GeneratorSpec }
    /** Compile a document's pipeline now, before any surface draws it. */
    | { type: 'prepare', doc: AuroraDocument, output: RgbSpace }
    | { type: 'attach', id: number, canvas: OffscreenCanvas, state: SurfaceState }
    | { type: 'update', id: number, state: SurfaceState }
    | { type: 'detach', id: number }
    | { type: 'stats' }

export interface RendererStats {
  surfaces: number
  /** Batches submitted since start. */
  frames: number
  /** Last batch's CPU-to-GPU-done time in milliseconds. */
  frameMs: number
}

export type WorkerResponse
  = | { type: 'ready', available: boolean }
    | { type: 'frame', id: number }
    | { type: 'fail' }
    | { type: 'stats', stats: RendererStats }
