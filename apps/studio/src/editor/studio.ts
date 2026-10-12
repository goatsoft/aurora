import { GENERATORS, loadGenerators } from '@goatsoft/aurora'
import type { Generator } from '@goatsoft/aurora'
import type { AuroraDocument, FormatIssue } from '@goatsoft/aurora-format'
import { computed, reactive, shallowRef, watch } from 'vue'
import { ops, resolve, serialize, starter } from './document'
import type { Doc, LayerInput } from './document'

interface Entry {
  doc: Doc
  ids: number[]
}
import { History } from './history'
import { decodeShare, encodeShare } from './share'
import { load, save } from './storage'
import { forgetConnection, projectApi, takeConnection } from './project'
import type { Connection } from './project'

export type Viewport = 'hero' | 'panel' | 'tile' | 'phone' | 'page'
export type Preview = 'webgpu' | 'css' | 'split'
export type Page = 'dark' | 'light'

/** Frame sizes for the viewport presets, in CSS pixels. `page` fills the stage and scrolls. */
export const VIEWPORTS: Record<Viewport, { label: string, width: number, height: number }> = {
  hero: { label: 'Hero', width: 1440, height: 720 },
  panel: { label: 'Panel', width: 960, height: 540 },
  tile: { label: 'Tile', width: 420, height: 420 },
  phone: { label: 'Phone', width: 390, height: 844 },
  page: { label: 'Full page', width: 0, height: 0 },
}

const AUTOSAVE = 'document'

/** What Studio is showing; none of it is saved in the document. */
export interface UiState {
  /** The selected layer's index. */
  layer: number
  viewport: Viewport
  preview: Preview
  page: Page
  playing: boolean
  reducedMotion: boolean
  scroll: number
  /** Where the split view's divider sits, 0–1. */
  split: number
  palette: boolean
  gallery: boolean
  /** Layer ids hidden or soloed while designing. */
  muted: Set<number>
  solo: number | undefined
  notices: Notice[]
}

/** A toast: what happened, and optionally how to undo it. */
export interface Notice {
  id: number
  message: string
  tone: 'info' | 'error'
}

function createStudio() {
  let nextId = 0
  const fresh = (doc: Doc): Entry => ({ doc, ids: doc.layers.map(() => ++nextId) })
  const history = new History<Entry>(fresh(starter()))
  /** The document as authored: what is saved and shared. */
  const doc = shallowRef<Doc>(history.present.doc)
  /** Stable ids for the layers, so lists can animate reorders. */
  const layerIds = shallowRef<number[]>(history.present.ids)
  /** The last document that validated, so the canvas never blanks while you type. */
  const rendered = shallowRef<AuroraDocument>(resolveOrThrow(history.present.doc))
  const issues = shallowRef<FormatIssue[]>([])
  const generators = shallowRef<Generator[]>(Object.values(GENERATORS))
  const historyState = reactive({ canUndo: false, canRedo: false })

  const ui = reactive<UiState>({
    layer: 0,
    viewport: 'hero',
    preview: 'webgpu',
    page: 'dark',
    playing: true,
    reducedMotion: false,
    scroll: 0,
    split: 0.5,
    palette: false,
    gallery: false,
    muted: new Set(),
    solo: undefined,
    notices: [],
  })

  let noticeId = 0
  function notify(message: string, tone: Notice['tone'] = 'info') {
    const notice = { id: ++noticeId, message, tone }
    ui.notices = [...ui.notices.slice(-2), notice]
    setTimeout(() => {
      ui.notices = ui.notices.filter((n) => n.id !== notice.id)
    }, tone === 'error' ? 6000 : 2800)
  }

  function sync() {
    doc.value = history.present.doc
    layerIds.value = history.present.ids
    historyState.canUndo = history.canUndo
    historyState.canRedo = history.canRedo
    const result = resolve(history.present.doc)
    if (result.ok) {
      rendered.value = result.doc
      issues.value = []
    } else {
      issues.value = result.issues
    }
    ui.layer = Math.max(0, Math.min(ui.layer, history.present.doc.layers.length - 1))
  }

  /**
   * Applies an edit. Edits in the same `group` (one slider drag) undo as one step. Pass `ids` when
   * the edit changes the layer list; otherwise the layers keep theirs.
   */
  function commit(next: Doc, group?: string, ids?: number[]) {
    const same = next.layers.length === history.present.ids.length
    history.push({ doc: next, ids: ids ?? (same ? history.present.ids : next.layers.map(() => ++nextId)) }, group)
    sync()
  }

  /** Runs one of the document operations and commits the result. */
  function apply<A extends unknown[]>(op: (doc: Doc, ...args: A) => Doc, ...args: A): void {
    commit(op(history.present.doc, ...args))
  }

  /** Layer-list edits that keep every surviving layer's id. */
  const layers = {
    /** Inserts a layer; `base` lets the same step also add the colours it brings. */
    add(layer: LayerInput, at = history.present.doc.layers.length, base = history.present.doc) {
      const ids = [...history.present.ids]
      ids.splice(at, 0, ++nextId)
      commit(ops.addLayer(base, layer, at), undefined, ids)
      ui.layer = at
    },
    remove(i: number) {
      if (history.present.doc.layers.length <= 1) return
      commit(ops.removeLayer(history.present.doc, i), undefined, history.present.ids.filter((_, k) => k !== i))
    },
    duplicate(i: number) {
      const ids = [...history.present.ids]
      ids.splice(i + 1, 0, ++nextId)
      commit(ops.duplicateLayer(history.present.doc, i), undefined, ids)
      ui.layer = i + 1
    },
    move(from: number, to: number) {
      if (from === to) return
      const ids = [...history.present.ids]
      const [id] = ids.splice(from, 1)
      ids.splice(to, 0, id!)
      commit(ops.moveLayer(history.present.doc, from, to), undefined, ids)
      ui.layer = to
    },
  }

  function undo() {
    if (history.undo() !== undefined) sync()
  }

  function redo() {
    if (history.redo() !== undefined) sync()
  }

  /** Opens a document (file, link or preset), replacing the current one. Undo brings the old one back. */
  function open(input: unknown, origin = 'document'): boolean {
    const result = resolve(input as Doc)
    if (!result.ok) {
      const first = result.issues[0]!
      notify(`That ${origin} isn't a valid .aurora file: ${first.path} ${first.message}`, 'error')
      return false
    }
    history.seal()
    project.current = undefined
    const next = structuredClone(input as Doc)
    commit(next, undefined, next.layers.map(() => ++nextId))
    ui.layer = 0
    ui.muted = new Set()
    ui.solo = undefined
    return true
  }

  async function openFile(file: File) {
    try {
      if (open(JSON.parse(await file.text()), file.name)) notify(`Opened ${file.name}`)
    } catch {
      notify(`${file.name} isn't JSON. .aurora files are JSON documents.`, 'error')
    }
  }

  /** What the canvas shows: the rendered document with muted layers hidden and motion previews applied. */
  const preview = computed<AuroraDocument>(() => {
    const base = rendered.value
    const ids = layerIds.value
    const visible = base.layers.map((_, i) => (ui.solo === undefined ? !ui.muted.has(ids[i]!) : ui.solo === ids[i]))
    const layers = base.layers.map((layer, i) => (visible[i] ? layer : { ...layer, opacity: 0 }))
    const speed = ui.playing ? base.motion.speed * (ui.reducedMotion && base.motion.reduced === 'slow' ? 0.1 : 1) : 0
    return { ...base, layers, motion: { ...base.motion, speed: ui.reducedMotion && base.motion.reduced === 'still' ? 0 : speed } }
  })

  const file = computed(() => serialize(doc.value))
  const fileName = computed(() => `${doc.value.name.trim().toLowerCase().replace(/[^a-z\d]+/g, '-').replace(/^-|-$/g, '') || 'aurora'}.aurora`)

  // Dev-tool mode: a connected project's files, opened and saved in place.
  const project = reactive({
    connection: undefined as Connection | undefined,
    root: '',
    files: [] as string[],
    current: undefined as string | undefined,
    /** The file as last read or written, to tell whether there are unsaved changes. */
    saved: '',
  })
  const dirty = computed(() => project.current !== undefined && file.value !== project.saved)

  async function refreshFiles() {
    if (!project.connection) return
    try {
      const listing = await projectApi.files(project.connection)
      project.root = listing.root
      project.files = listing.files
    } catch (error) {
      notify((error as Error).message, 'error')
    }
  }

  async function openProjectFile(path: string) {
    if (!project.connection) return
    try {
      const text = await projectApi.read(project.connection, path)
      if (open(JSON.parse(text), path)) {
        project.current = path
        project.saved = serialize(history.present.doc)
        notify(`Opened ${path}`)
      }
    } catch (error) {
      notify((error as Error).message, 'error')
    }
  }

  /** Saves to the open project file. Returns false when there is none, so callers download instead. */
  async function saveToProject(): Promise<boolean> {
    if (!project.connection || project.current === undefined) return false
    // Never rewrite a file you haven't changed (it may be formatted by hand).
    if (!dirty.value) {
      notify(`No changes to save in ${project.current}`)
      return true
    }
    const text = file.value
    try {
      await projectApi.write(project.connection, project.current, text)
      project.saved = text
      notify(`Saved ${project.current}`)
    } catch (error) {
      notify((error as Error).message, 'error')
    }
    return true
  }

  function disconnect() {
    forgetConnection()
    Object.assign(project, { connection: undefined, files: [], current: undefined, saved: '' })
  }

  async function shareLink(): Promise<string> {
    const url = new URL(location.href)
    url.hash = await encodeShare(doc.value)
    return url.toString()
  }

  async function start() {
    project.connection = takeConnection()
    void refreshFiles()
    await loadGenerators()
    generators.value = Object.values(GENERATORS).filter((g) => !g.id.startsWith('test-'))
    const shared = await decodeShare(location.hash)
    if (shared !== undefined && open(shared, 'link')) {
      history.reset(history.present)
      sync()
      history.seal()
      // The link has done its job; keep the address bar clean.
      window.history.replaceState(null, '', location.pathname + location.search)
      notify('Opened a shared aurora')
    } else {
      const saved = await load<Doc>(AUTOSAVE)
      if (saved && resolve(saved).ok) {
        history.reset(fresh(saved))
        sync()
      }
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    watch(doc, (next) => {
      clearTimeout(timer)
      timer = setTimeout(() => void save(AUTOSAVE, structuredClone(next)), 400)
    })
  }

  return {
    doc,
    layerIds,
    layers,
    rendered,
    preview,
    issues,
    generators,
    history: historyState,
    ui,
    file,
    fileName,
    ops,
    commit,
    apply,
    seal: () => history.seal(),
    undo,
    redo,
    open,
    openFile,
    shareLink,
    project,
    dirty,
    refreshFiles,
    openProjectFile,
    saveToProject,
    disconnect,
    notify,
    start,
    generator: (id: string) => generators.value.find((g) => g.id === id) ?? GENERATORS[id],
  }
}

function resolveOrThrow(doc: Doc): AuroraDocument {
  const result = resolve(doc)
  if (!result.ok) throw new Error(`Studio's starter document is invalid: ${result.issues[0]!.path} ${result.issues[0]!.message}`)
  return result.doc
}

let studio: ReturnType<typeof createStudio> | undefined

/** The Studio editor state: one per app. */
export function useStudio(): ReturnType<typeof createStudio> {
  studio ??= createStudio()
  return studio
}
