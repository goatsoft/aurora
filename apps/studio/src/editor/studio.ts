import type { Doc, LayerInput } from './document'
import type { Generator } from '@goatsoft/aurora'
import type { AuroraDocument, FormatIssue } from '@goatsoft/aurora-format'
import { GENERATORS, loadGenerators } from '@goatsoft/aurora'
import { MAX_LAYERS } from '@goatsoft/aurora-format'
import { computed, reactive, shallowRef, watch } from 'vue'
import { ops, resolve, serialize, starter } from './document'

interface Entry {
  doc: Doc
  ids: number[]
}
import type { Workspace } from './workspace'
import { download } from './export'
import { History } from './history'
import { forgetConnection, takeConnection } from './project'
import { decodeShare, encodeShare } from './share'
import { load, save } from './storage'
import { apiWorkspace, canUseDisk, fileWorkspace, folderWorkspace, pickFile, pickFolder, pickSaveTarget } from './workspace'

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
const WORKSPACE = 'workspace'

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
  /** Layer ids hidden while designing. */
  muted: Set<number>
  notices: Notice[]
  /** On small screens, which panel is open as a sheet at the bottom. */
  sheet: 'layers' | 'inspector' | undefined
  /** Hides the panels, so the canvas has the whole window. */
  focus: boolean
  /** The sample copy over the background, so you can judge how text reads on it. */
  copy: PreviewCopy
}

/** The sample text on the canvas. Kept in this browser, not in the document. */
export interface PreviewCopy {
  headline: string
  body: string
  action: string
}

export const DEFAULT_COPY: PreviewCopy = {
  headline: 'Your website headline',
  body: 'Click any text here to change it.',
  action: 'Get started',
}
const COPY = 'aurora-studio:copy'
function storedCopy(): PreviewCopy {
  try {
    const raw = localStorage.getItem(COPY)
    return raw ? { ...DEFAULT_COPY, ...(JSON.parse(raw) as Partial<PreviewCopy>) } : { ...DEFAULT_COPY }
  } catch {
    return { ...DEFAULT_COPY }
  }
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
    notices: [],
    sheet: undefined,
    focus: false,
    copy: storedCopy(),
  })
  watch(() => ({ ...ui.copy }), (copy) => {
    try {
      localStorage.setItem(COPY, JSON.stringify(copy))
    } catch {
      // Storage is off (a private window, say): the copy just isn't kept.
    }
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

  /** A document holds at most MAX_LAYERS layers; adding past that would make it invalid. */
  function full(): boolean {
    if (history.present.doc.layers.length < MAX_LAYERS) return false
    notify(`A background can have at most ${MAX_LAYERS} layers. Delete one to add another.`, 'error')
    return true
  }

  /** Layer-list edits that keep every surviving layer's id. */
  const layers = {
    /** Inserts a layer; `base` lets the same step also add the colours it brings. */
    add(layer: LayerInput, at = history.present.doc.layers.length, base = history.present.doc) {
      if (full()) return
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
      if (full()) return
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
    const visible = base.layers.map((_, i) => !ui.muted.has(ids[i]!))
    const layers = base.layers.map((layer, i) => (visible[i] ? layer : { ...layer, opacity: 0 }))
    const speed = ui.playing ? base.motion.speed * (ui.reducedMotion && base.motion.reduced === 'slow' ? 0.1 : 1) : 0
    return { ...base, layers, motion: { ...base.motion, speed: ui.reducedMotion && base.motion.reduced === 'still' ? 0 : speed } }
  })

  const file = computed(() => serialize(doc.value))
  const fileName = computed(() => `${doc.value.name.trim().toLowerCase().replace(/[^a-z\d]+/g, '-').replace(/^-|-$/g, '') || 'aurora'}.aurora`)

  // Where the open file lives, so ⌘S saves it in place: a dev-server project, a folder or one file
  // picked on disk. With none, saving downloads.
  const project = reactive({
    workspace: undefined as Workspace | undefined,
    label: '',
    files: [] as string[],
    current: undefined as string | undefined,
    /** The file as last read or written, to tell whether there are unsaved changes. */
    saved: '',
    /** A folder remembered from last time, waiting for the browser to grant access again. */
    locked: false,
  })
  const dirty = computed(() => project.current !== undefined && file.value !== project.saved)
  const fail = (error: unknown) => notify(error instanceof Error ? error.message : String(error), 'error')

  async function refreshFiles() {
    const ws = project.workspace
    if (!ws) return
    try {
      project.files = await ws.files()
      project.label = ws.label
      project.locked = false
    } catch (error) {
      fail(error)
    }
  }

  function useWorkspace(ws: Workspace | undefined, handle?: FileSystemHandle) {
    Object.assign(project, { workspace: ws, label: ws?.label ?? '', files: [], current: undefined, saved: '', locked: false })
    // Folder and file handles survive reloads in IndexedDB (access is asked for again on first use).
    void save(WORKSPACE, handle ?? null)
  }

  async function openProjectFile(path: string) {
    const ws = project.workspace
    if (!ws) return
    try {
      const text = await ws.read(path)
      if (open(JSON.parse(text), path)) {
        project.current = path
        project.saved = serialize(history.present.doc)
        notify(`Opened ${path}`)
      }
    } catch (error) {
      fail(error instanceof SyntaxError ? new Error(`${path} isn't JSON. .aurora files are JSON documents.`) : error)
    }
  }

  /** Opens a file handle (picked or dropped), so ⌘S saves back to it. */
  async function openHandle(handle: FileSystemFileHandle) {
    const ws = fileWorkspace(handle)
    useWorkspace(ws, handle)
    project.files = [handle.name]
    await openProjectFile(handle.name)
  }

  async function openFromDisk(): Promise<boolean> {
    if (!canUseDisk()) return false
    try {
      const handle = await pickFile()
      if (handle) await openHandle(handle)
    } catch (error) {
      fail(error)
    }
    return true
  }

  async function openFolder() {
    try {
      const handle = await pickFolder()
      if (!handle) return
      useWorkspace(folderWorkspace(handle), handle)
      await refreshFiles()
      notify(project.files.length ? `Opened ${handle.name}: ${project.files.length} .aurora file${project.files.length === 1 ? '' : 's'}` : `Opened ${handle.name}. It has no .aurora files yet; Save as puts one there.`)
    } catch (error) {
      fail(error)
    }
  }

  /**
   * Why the document can't leave Studio as it is, or undefined when it can. Every way out (saving,
   * Save as, Download, share links) checks this, so no path produces a file that wouldn't load.
   */
  function exportProblem(): string | undefined {
    const result = resolve(history.present.doc)
    return result.ok ? undefined : `${result.issues[0]!.path} ${result.issues[0]!.message}`
  }

  /** Downloads the `.aurora` file, unless it's invalid. Returns whether it did. */
  function downloadDocument(): boolean {
    const problem = exportProblem()
    if (problem) {
      notify(`Not downloaded: ${problem}`, 'error')
      return false
    }
    download(fileName.value, file.value)
    notify(`Downloaded ${fileName.value}`)
    return true
  }

  async function write(ws: Workspace, path: string, text: string) {
    // Never write a file that wouldn't load (the dev-server API checks this too).
    const problem = exportProblem()
    if (problem) throw new Error(`Not saved: ${problem}`)
    await ws.write(path, text)
    project.saved = text
    notify(`Saved ${path}`)
  }

  /** Saves the open file in place. Returns false when there is nowhere to save, so callers fall back. */
  async function saveToProject(): Promise<boolean> {
    const ws = project.workspace
    if (!ws || project.current === undefined) return false
    // Never rewrite a file you haven't changed (it may be formatted by hand).
    if (!dirty.value) {
      notify(`No changes to save in ${project.current}`)
      return true
    }
    try {
      await write(ws, project.current, file.value)
    } catch (error) {
      fail(error)
    }
    return true
  }

  /**
   * Saves to a new place: `path` inside the open folder or project, or (with no folder open)
   * wherever the system picker says. Afterwards ⌘S saves there.
   */
  async function saveAs(path?: string): Promise<boolean> {
    const ws = project.workspace
    try {
      if (path !== undefined && (ws?.kind === 'folder' || ws?.kind === 'api')) {
        const target = path.endsWith('.aurora') ? path : `${path}.aurora`
        await write(ws, target, file.value)
        project.current = target
        await refreshFiles()
        return true
      }
      if (!canUseDisk()) return false
      // Say so before the picker, rather than after the user has chosen where.
      const problem = exportProblem()
      if (problem) throw new Error(`Not saved: ${problem}`)
      const handle = await pickSaveTarget(fileName.value)
      if (!handle) return true
      const next = fileWorkspace(handle)
      useWorkspace(next, handle)
      project.files = [handle.name]
      project.current = handle.name
      await write(next, handle.name, file.value)
    } catch (error) {
      fail(error)
    }
    return true
  }

  function disconnect() {
    forgetConnection()
    useWorkspace(undefined)
  }

  /** A link holding the whole document, or undefined (with a notice) when it's invalid. */
  async function shareLink(): Promise<string | undefined> {
    const problem = exportProblem()
    if (problem) {
      notify(`No link made: ${problem}`, 'error')
      return undefined
    }
    const url = new URL(location.href)
    url.hash = await encodeShare(doc.value)
    return url.toString()
  }

  async function start() {
    const connection = takeConnection()
    if (connection) {
      project.workspace = apiWorkspace(connection)
      void refreshFiles()
    } else {
      const handle = await load<FileSystemHandle | null>(WORKSPACE)
      if (handle) {
        project.workspace = handle.kind === 'directory' ? folderWorkspace(handle as FileSystemDirectoryHandle) : fileWorkspace(handle as FileSystemFileHandle)
        project.label = handle.name
        project.locked = true
      }
    }
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
    let warned = false
    watch(doc, (next) => {
      clearTimeout(timer)
      timer = setTimeout(() => void save(AUTOSAVE, structuredClone(next)).then((saved) => {
        // Say so once: the work is still here, but a reload would lose it.
        if (saved || warned) return
        warned = true
        notify('Autosave isn\'t working in this browser (storage is off or full). Export or share a link to keep your work.', 'error')
      }), 400)
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
    downloadDocument,
    exportProblem,
    project,
    dirty,
    refreshFiles,
    openProjectFile,
    openHandle,
    openFromDisk,
    openFolder,
    saveToProject,
    saveAs,
    disconnect,
    canUseDisk,
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
