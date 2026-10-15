/** A surface taking part in a scene: it reports its document-space rectangle and hears about changes. */
export interface SceneMember {
  rect: () => { left: number, top: number, width: number, height: number }
  changed: () => void
}

export interface SceneGeometry {
  /** The scene's size in CSS pixels. */
  width: number
  height: number
  /** The member's rectangle in scene UV. */
  rect: [number, number, number, number]
}

interface Scene {
  origin: number
  pausedAt: number | undefined
  members: Set<SceneMember>
}

const scenes = new Map<string, Scene>()

/**
 * Joins a named scene. Members share one clock and one document-space field, so separate panels
 * read as one continuous background. The scene ends with its last member.
 */
export function joinScene(name: string, member: SceneMember, now: number) {
  let scene = scenes.get(name)
  if (!scene) {
    scene = { origin: now, pausedAt: undefined, members: new Set() }
    scenes.set(name, scene)
  }
  const current = scene
  current.members.add(member)
  for (const other of current.members) if (other !== member) other.changed()
  return {
    get origin() { return current.origin },
    get pausedAt() { return current.pausedAt },
    pause(at: number) {
      if (current.pausedAt !== undefined) return
      current.pausedAt = at
      for (const other of current.members) other.changed()
    },
    resume(at: number) {
      if (current.pausedAt === undefined) return
      current.origin += at - current.pausedAt
      current.pausedAt = undefined
      for (const other of current.members) other.changed()
    },
    /** Tells the other members this one moved or resized, so they recompute their part. */
    notify() {
      for (const other of current.members) if (other !== member) other.changed()
    },
    leave() {
      if (!current.members.delete(member)) return
      if (current.members.size) for (const other of current.members) other.changed()
      else if (scenes.get(name) === current) scenes.delete(name)
    },
  }
}

/** The union of a scene's members, and where `member` sits in it. */
export function sceneGeometry(name: string, member: SceneMember): SceneGeometry {
  const own = member.rect()
  const members = scenes.get(name)?.members
  const rects = members?.has(member) ? [...members].map((m) => (m === member ? own : m.rect())) : [own]
  const left = Math.min(...rects.map((r) => r.left))
  const top = Math.min(...rects.map((r) => r.top))
  const right = Math.max(...rects.map((r) => r.left + r.width))
  const bottom = Math.max(...rects.map((r) => r.top + r.height))
  const width = Math.max(1, right - left)
  const height = Math.max(1, bottom - top)
  return { width, height, rect: [(own.left - left) / width, (own.top - top) / height, Math.max(1, own.width) / width, Math.max(1, own.height) / height] }
}
