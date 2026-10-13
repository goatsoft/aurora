/**
 * Autosave: the working document lives in IndexedDB, so a reload or a crash never loses work.
 * One tiny key-value store. A read that fails (private mode, storage turned off) finds nothing; a
 * write reports whether it was committed, so Studio can say when autosave isn't working.
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

/** Runs one request and settles when its transaction completes, so a write is really on disk. */
async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode)
      const request = action(transaction.objectStore(STORE))
      const fail = () => reject(transaction.error ?? request.error ?? new Error('IndexedDB transaction failed.'))
      transaction.oncomplete = () => resolve(request.result as T)
      transaction.onerror = fail
      transaction.onabort = fail
    })
  } finally {
    db.close()
  }
}

export async function load<T>(key: string): Promise<T | undefined> {
  try {
    return await run<T | undefined>('readonly', (store) => store.get(key))
  } catch {
    return undefined
  }
}

/** Stores a value. Resolves false when it couldn't be stored (quota, private mode, storage off). */
export async function save(key: string, value: unknown): Promise<boolean> {
  try {
    await run('readwrite', (store) => store.put(value, key))
    return true
  } catch {
    return false
  }
}
