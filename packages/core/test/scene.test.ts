import type { SceneMember } from '@/scene'
import type { Mock } from 'vitest'
import { describe, expect, it, vi } from 'vitest'
import { joinScene, sceneGeometry } from '@/scene'

const member = (left: number, top: number, width: number, height: number): SceneMember & { changed: Mock<() => void> } => ({
  rect: () => ({ left, top, width, height }),
  changed: vi.fn<() => void>(),
})

describe('scenes', () => {
  it('shares pause state and the resumed phase, including members that join later', () => {
    const a = member(0, 0, 100, 100)
    const b = member(100, 0, 100, 100)
    const sa = joinScene('playback', a, 1000)
    const sb = joinScene('playback', b, 2000)
    sa.pause(5000)
    sb.pause(9000)
    const c = member(200, 0, 100, 100)
    const sc = joinScene('playback', c, 10_000)
    expect([sa.pausedAt, sb.pausedAt, sc.pausedAt]).toEqual([5000, 5000, 5000])
    sb.resume(25_000)
    sa.resume(30_000)
    expect([sa.origin, sb.origin, sc.origin]).toEqual([21_000, 21_000, 21_000])
    expect([sa.pausedAt, sb.pausedAt, sc.pausedAt]).toEqual([undefined, undefined, undefined])
    expect(a.changed).toHaveBeenCalled()
    expect(b.changed).toHaveBeenCalled()
    expect(c.changed).toHaveBeenCalled()
    sa.leave()
    sb.leave()
    sc.leave()
  })

  it('shares one clock and one field across members', () => {
    const a = member(0, 0, 400, 300)
    const b = member(400, 0, 400, 300)
    const sa = joinScene('landing', a, 1000)
    const sb = joinScene('landing', b, 5000)
    expect(sb.origin).toBe(1000)
    expect(a.changed).toHaveBeenCalledOnce()
    expect(sceneGeometry('landing', a)).toEqual({ width: 800, height: 300, rect: [0, 0, 0.5, 1] })
    expect(sceneGeometry('landing', b)).toEqual({ width: 800, height: 300, rect: [0.5, 0, 0.5, 1] })
    sb.leave()
    sb.leave()
    expect(a.changed).toHaveBeenCalledTimes(2)
    expect(sceneGeometry('landing', a).rect).toEqual([0, 0, 1, 1])
    sa.leave()
    expect(joinScene('landing', a, 9000).origin).toBe(9000)
  })

  it('tells the other members when one resizes, and not the one that did', () => {
    const a = member(0, 0, 400, 300)
    const b = member(400, 0, 400, 300)
    const sa = joinScene('resize', a, 0)
    joinScene('resize', b, 0)
    a.changed.mockClear()
    b.changed.mockClear()
    sa.notify()
    expect(b.changed).toHaveBeenCalledOnce()
    expect(a.changed).not.toHaveBeenCalled()
  })

  it('treats a surface outside any scene as its own scene', () => {
    expect(sceneGeometry('none', member(10, 20, 100, 50))).toEqual({ width: 100, height: 50, rect: [0, 0, 1, 1] })
  })

  it('survives zero-size members', () => {
    const z = member(0, 0, 0, 0)
    joinScene('tiny', z, 0)
    expect(sceneGeometry('tiny', z)).toEqual({ width: 1, height: 1, rect: [0, 0, 1, 1] })
  })
})
