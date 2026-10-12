// The parts of the File System Access API Studio uses (Chromium). TypeScript's DOM lib covers the
// handles themselves, but not the pickers or permissions.
interface FilePickerOptions {
  types?: { description?: string, accept: Record<string, string[]> }[]
  excludeAcceptAllOption?: boolean
  id?: string
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads'
}

interface Window {
  showOpenFilePicker?: (options?: FilePickerOptions & { multiple?: boolean }) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (options?: FilePickerOptions & { suggestedName?: string }) => Promise<FileSystemFileHandle>
  showDirectoryPicker?: (options?: { id?: string, mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}

interface FileSystemHandle {
  queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>
  requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>
}

interface DataTransferItem {
  getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>
}
