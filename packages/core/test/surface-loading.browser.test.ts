import type { Backend } from '@/pool'
import type { SurfaceState } from '@/protocol'
import { assertAurora } from '@goatsoft/aurora-format'
import { expect, it, vi } from 'vitest'
import { mountAurora } from '@/surface'
import { setBackends } from '@/surface'

const gate = vi.hoisted(() => {
  let release!: () => void
  const ready = new Promise<void>((resolve) => { release = resolve })
  return { ready, release }
})
vi.mock('@/interactions', async (original) => {
  await gate.ready
  return original()
})

it('attaches the authored first frame while input loads, and discards stale controllers', async () => {
  const states: SurfaceState[] = []
  const backend: Backend = {
    acquire: () => ({ ready: Promise.resolve(true), attach: (_, state) => { states.push(state); return true }, update() {}, release() {} }),
    stats: () => Promise.resolve(undefined),
  }
  setBackends({ main: backend, worker: backend })
  const doc = assertAurora({ format: 'aurora', version: 1, name: 'Loading input', palette: ['#123'], layers: [{ type: 'linear-gradient' }], interactions: [{ type: 'follow', bindings: [{ layer: 0, parameter: 'offsetX', input: 'x' }] }] })
  const hosts = Array.from({ length: 3 }, () => document.body.appendChild(document.createElement('div')))
  const surfaces = hosts.map((host) => mountAurora(host, doc))
  let ready = false
  void surfaces[0]!.ready.then(() => { ready = true })
  try {
    await vi.waitFor(() => expect(states).toHaveLength(3))
    expect(states[0]!.doc).toEqual(doc)
    expect(states[0]!.transforms).toBeUndefined()
    expect(surfaces[0]!.interactions).toBeUndefined()
    expect(ready).toBe(false)
    surfaces[1]!.dispose()
    const { interactions: _, ...plain } = doc
    surfaces[2]!.update(plain)
    gate.release()
    await Promise.all(surfaces.map((surface) => surface.ready))
    expect(surfaces[0]!.interactions).toBeDefined()
    expect(surfaces[1]!.interactions).toBeUndefined()
    expect(surfaces[2]!.interactions).toBeUndefined()
  } finally {
    gate.release()
    surfaces.forEach((surface) => surface.dispose())
    hosts.forEach((host) => host.remove())
    setBackends(undefined)
  }
})
