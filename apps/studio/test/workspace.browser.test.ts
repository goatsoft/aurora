import { beforeEach, describe, expect, it } from 'vitest'
import { fileWorkspace, folderWorkspace } from '@/editor/workspace'

// The origin-private file system gives real File System Access handles without a picker.
let root: FileSystemDirectoryHandle
beforeEach(async () => {
  const opfs = await navigator.storage.getDirectory()
  await opfs.removeEntry('project', { recursive: true }).catch(() => undefined)
  root = await opfs.getDirectoryHandle('project', { create: true })
  const presets = await root.getDirectoryHandle('presets', { create: true })
  const deps = await (await root.getDirectoryHandle('node_modules', { create: true })).getDirectoryHandle('pkg', { create: true })
  for (const [dir, name, text] of [[presets, 'hero.aurora', '{"a":1}\n'], [root, 'top.aurora', '{}\n'], [deps, 'skip.aurora', '{}\n'], [presets, 'notes.md', '#']] as const) {
    const stream = await (await dir.getFileHandle(name, { create: true })).createWritable()
    await stream.write(text)
    await stream.close()
  }
})

describe('folder workspace', () => {
  it('lists .aurora files, skipping dependencies', async () => {
    expect(await folderWorkspace(root).files()).toEqual(['presets/hero.aurora', 'top.aurora'])
  })

  it('reads and writes files in place, creating folders for new ones', async () => {
    const ws = folderWorkspace(root)
    expect(await ws.read('presets/hero.aurora')).toBe('{"a":1}\n')
    await ws.write('presets/hero.aurora', '{"a":2}\n')
    expect(await ws.read('presets/hero.aurora')).toBe('{"a":2}\n')
    await ws.write('new/deep/scene.aurora', '{}\n')
    expect(await ws.files()).toEqual(['new/deep/scene.aurora', 'presets/hero.aurora', 'top.aurora'])
  })
})

describe('file workspace', () => {
  it('saves back to the one file it was opened from', async () => {
    const handle = await root.getFileHandle('top.aurora')
    const ws = fileWorkspace(handle)
    expect([ws.label, await ws.files()]).toEqual(['top.aurora', ['top.aurora']])
    await ws.write('top.aurora', '{"b":1}\n')
    expect(await (await handle.getFile()).text()).toBe('{"b":1}\n')
  })
})
