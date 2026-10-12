import { projectApi } from './project'
import type { Connection } from './project'

/**
 * Where Studio's open file lives, so ⌘S saves it in place:
 * - `api`: a project on disk, through the unplugin's dev server or `npx aurora studio`;
 * - `folder`: a folder picked with the File System Access API (Chromium);
 * - `file`: one file opened, dropped or "saved as" with the same API.
 * Without any of these, saving downloads the file.
 */
export interface Workspace {
  kind: 'api' | 'folder' | 'file'
  /** What to call it in the UI: the project or folder name, or the file name. */
  label: string
  /** `.aurora` paths, relative to the workspace, sorted. */
  files: () => Promise<string[]>
  read: (path: string) => Promise<string>
  write: (path: string, text: string) => Promise<void>
}

export function apiWorkspace(connection: Connection): Workspace {
  let label = 'project'
  return {
    kind: 'api',
    get label() {
      return label
    },
    async files() {
      const listing = await projectApi.files(connection)
      label = listing.root
      return listing.files
    },
    read: (path) => projectApi.read(connection, path),
    write: async (path, text) => {
      await projectApi.write(connection, path, text)
    },
  }
}

/** Whether this browser can open and save files in place (File System Access API). */
export const canUseDisk = () => typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function'

const TYPES = [{ description: 'Aurora background', accept: { 'application/json': ['.aurora'] } }]
const SKIP = new Set(['node_modules', 'dist', 'coverage', '.git', '.cache', '.turbo'])

/** Asks for read-write access if the browser doesn't already have it (it lapses across reloads). */
async function writable(handle: FileSystemHandle): Promise<void> {
  if (!handle.queryPermission || (await handle.queryPermission({ mode: 'readwrite' })) === 'granted') return
  if ((await handle.requestPermission?.({ mode: 'readwrite' })) !== 'granted') {
    throw new Error(`Studio needs permission to edit "${handle.name}". Allow it when your browser asks.`)
  }
}

async function writeHandle(handle: FileSystemFileHandle, text: string): Promise<void> {
  await writable(handle)
  const stream = await handle.createWritable()
  await stream.write(text)
  await stream.close()
}

export function fileWorkspace(handle: FileSystemFileHandle): Workspace {
  return {
    kind: 'file',
    label: handle.name,
    files: () => Promise.resolve([handle.name]),
    read: async () => (await handle.getFile()).text(),
    write: (_, text) => writeHandle(handle, text),
  }
}

export function folderWorkspace(root: FileSystemDirectoryHandle): Workspace {
  async function walk(dir: FileSystemDirectoryHandle, prefix: string): Promise<string[]> {
    const out: string[] = []
    for await (const [name, entry] of dir) {
      if (entry.kind === 'directory') {
        if (!SKIP.has(name) && !name.startsWith('.')) out.push(...await walk(entry as FileSystemDirectoryHandle, `${prefix}${name}/`))
      } else if (name.endsWith('.aurora')) {
        out.push(`${prefix}${name}`)
      }
    }
    return out
  }
  async function handleFor(path: string, create: boolean): Promise<FileSystemFileHandle> {
    const parts = path.split('/')
    let dir = root
    for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create })
    return dir.getFileHandle(parts.at(-1)!, { create })
  }
  return {
    kind: 'folder',
    label: root.name,
    files: async () => {
      await writable(root)
      return (await walk(root, '')).sort()
    },
    read: async (path) => (await (await handleFor(path, false)).getFile()).text(),
    write: async (path, text) => {
      await writable(root)
      await writeHandle(await handleFor(path, true), text)
    },
  }
}

/** Opens one `.aurora` file with the system picker. Undefined if the user cancels. */
export async function pickFile(): Promise<FileSystemFileHandle | undefined> {
  try {
    const [handle] = await window.showOpenFilePicker!({ types: TYPES, id: 'aurora' })
    return handle
  } catch (error) {
    if ((error as DOMException).name === 'AbortError') return undefined
    throw error
  }
}

/** Picks a folder of `.aurora` files to work in. Undefined if the user cancels. */
export async function pickFolder(): Promise<FileSystemDirectoryHandle | undefined> {
  try {
    return await window.showDirectoryPicker!({ id: 'aurora', mode: 'readwrite' })
  } catch (error) {
    if ((error as DOMException).name === 'AbortError') return undefined
    throw error
  }
}

/** Chooses where to save a new file. Undefined if the user cancels. */
export async function pickSaveTarget(suggestedName: string): Promise<FileSystemFileHandle | undefined> {
  try {
    return await window.showSaveFilePicker!({ types: TYPES, id: 'aurora', suggestedName })
  } catch (error) {
    if ((error as DOMException).name === 'AbortError') return undefined
    throw error
  }
}
