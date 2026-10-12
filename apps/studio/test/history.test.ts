import { describe, expect, it } from 'vitest'
import { History } from '@/editor/history'

describe('History', () => {
  it('undoes and redoes, and a new edit clears the redo stack', () => {
    const h = new History('a')
    h.push('b')
    h.push('c')
    expect(h.undo()).toBe('b')
    expect(h.undo()).toBe('a')
    expect(h.undo()).toBeUndefined()
    expect(h.redo()).toBe('b')
    h.push('x')
    expect(h.canRedo).toBe(false)
    expect(h.present).toBe('x')
  })

  it('collapses a gesture into one step, within its time window', () => {
    const h = new History(0)
    h.push(1, 'speed', 0)
    h.push(2, 'speed', 100)
    h.push(3, 'speed', 200)
    expect(h.undo()).toBe(0)
    h.push(1, 'speed', 0)
    h.push(2, 'speed', 5000)
    expect(h.undo()).toBe(1)
  })

  it('starts a new step after seal(), even in the same group', () => {
    const h = new History(0)
    h.push(1, 'g', 0)
    h.seal()
    h.push(2, 'g', 10)
    expect(h.undo()).toBe(1)
  })

  it('keeps at most `limit` steps and ignores no-op pushes', () => {
    const h = new History(0, 2)
    h.push(0)
    for (let i = 1; i <= 5; i++) h.push(i)
    expect(h.undo()).toBe(4)
    expect(h.undo()).toBe(3)
    expect(h.undo()).toBeUndefined()
  })

  it('resets to a state with no history', () => {
    const h = new History(0)
    h.push(1)
    h.reset(9)
    expect([h.present, h.canUndo, h.canRedo]).toEqual([9, false, false])
  })
})
