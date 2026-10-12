/**
 * Undo/redo over immutable snapshots. Continuous gestures (dragging a slider, scrubbing a number)
 * pass the same `group` key and collapse into one step, so one undo reverts one gesture.
 */
export class History<T> {
  private past: T[] = []
  private future: T[] = []
  private group: string | undefined
  private groupAt = 0

  constructor(public present: T, private readonly limit = 200, private readonly window = 800) {}

  get canUndo(): boolean {
    return this.past.length > 0
  }

  get canRedo(): boolean {
    return this.future.length > 0
  }

  /** Records a new state. Within `window` ms of the last push with the same group, it replaces it. */
  push(next: T, group?: string, now = Date.now()): void {
    if (next === this.present) return
    const merge = group !== undefined && group === this.group && now - this.groupAt < this.window
    if (!merge) {
      this.past.push(this.present)
      if (this.past.length > this.limit) this.past.shift()
    }
    this.present = next
    this.future = []
    this.group = group
    this.groupAt = now
  }

  /** Ends the current gesture, so the next push starts a new step even with the same group. */
  seal(): void {
    this.group = undefined
  }

  undo(): T | undefined {
    const previous = this.past.pop()
    if (previous === undefined) return undefined
    this.future.push(this.present)
    this.present = previous
    this.group = undefined
    return previous
  }

  redo(): T | undefined {
    const next = this.future.pop()
    if (next === undefined) return undefined
    this.past.push(this.present)
    this.present = next
    this.group = undefined
    return next
  }

  /** Starts over from `state` (opening a file), with no history. */
  reset(state: T): void {
    this.past = []
    this.future = []
    this.present = state
    this.group = undefined
  }
}
