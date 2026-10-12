/**
 * Autosave: the working document lives in IndexedDB, so a reload or a crash never loses work.
 * One tiny key-value store; failures (private mode, quota) are ignored, since autosave is a
 * convenience and the document is still in memory.
 */
const DB = 'aurora-studio'
const STORE = 'kv'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB is unavailable.'))
  })
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  try {
    const db = await open()
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE))
      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
    }).finally(() => db.close())
  } catch {
    return undefined
  }
}

export const load = <T>(key: string): Promise<T | undefined> => run<T>('readonly', (store) => store.get(key))
export const save = (key: string, value: unknown): Promise<unknown> => run('readwrite', (store) => store.put(value, key))
