import { loadGenerators } from '@goatsoft/aurora'
import { MAX_LAYERS } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { newLayer } from '@/editor/document'
import { useStudio } from '@/editor/studio'

// Studio loads every generator when it starts; documents are checked against them.
await loadGenerators()
const studio = useStudio()

describe('Studio store', () => {
  it('keeps layer ids through adds, moves, undo and redo', () => {
    const [first] = studio.layerIds.value
    studio.layers.add(newLayer('grain', [0]))
    const [, second] = studio.layerIds.value
    studio.layers.move(1, 0)
    expect(studio.layerIds.value).toEqual([second, first])
    expect(studio.doc.value.layers.map((l) => l.type)).toEqual(['grain', 'aurora-fbm'])
    studio.undo()
    expect(studio.layerIds.value).toEqual([first, second])
    studio.redo()
    expect(studio.layerIds.value).toEqual([second, first])
    expect(studio.ui.layer).toBe(0)
  })

  it('collapses one gesture into one undo step', () => {
    const before = studio.doc.value
    for (const v of [0.1, 0.2, 0.3]) studio.commit(studio.ops.param(studio.doc.value, 1, 'speed', v), 'param:1:speed')
    studio.seal()
    expect(studio.doc.value.layers[1]!.params).toEqual({ speed: 0.3 })
    studio.undo()
    expect(studio.doc.value).toBe(before)
  })

  it('hides muted layers in the preview only', () => {
    const [grain] = studio.layerIds.value
    studio.ui.muted.add(grain!)
    expect(studio.preview.value.layers.map((l) => l.opacity)).toEqual([0, 1])
    expect(studio.file.value).not.toContain('"opacity"')
    studio.ui.muted.clear()
  })

  it('keeps playback out of the authored document and the preview speed', () => {
    const file = studio.file.value
    const preview = studio.preview.value
    studio.ui.playing = false
    studio.ui.reducedMotion = true
    expect(studio.preview.value).toBe(preview)
    expect(studio.preview.value.motion.speed).toBe(1)
    expect(studio.rendered.value.motion.speed).toBe(1)
    expect(studio.file.value).toBe(file)
    studio.ui.playing = true
    studio.ui.reducedMotion = false
  })

  it('names exactly what is wrong when a document can\'t be opened', () => {
    expect(studio.open({ format: 'aurora', version: 1, name: 'x', palette: [], layers: [] }, 'file')).toBe(false)
    expect(studio.ui.notices.at(-1)).toMatchObject({ tone: 'error', message: 'That file isn\'t a valid .aurora file: $.palette must have at least one colour.' })
  })

  it('keeps showing the last valid document while the edited one is invalid', () => {
    const good = studio.rendered.value
    studio.commit(studio.ops.color(studio.doc.value, 0, 'not a colour'))
    expect(studio.issues.value[0]?.path).toBe('$.palette[0]')
    expect(studio.rendered.value).toBe(good)
    studio.undo()
    expect(studio.issues.value).toEqual([])
  })

  it('checks generators and parameters as strictly as the build plugin', () => {
    const good = studio.rendered.value
    studio.commit({ ...studio.doc.value, layers: [{ ...studio.doc.value.layers[0]!, type: 'nebula' }] })
    expect(studio.issues.value[0]).toMatchObject({ path: '$.layers[0].type' })
    expect(studio.rendered.value).toBe(good)
    studio.undo()
    studio.commit(studio.ops.param(studio.doc.value, 1, 'speed', 99))
    expect(studio.issues.value[0]?.path).toBe('$.layers[1].params.speed')
    studio.undo()
    expect(studio.open({ ...studio.doc.value, layers: [{ type: 'nebula' }] })).toBe(false)
    expect(studio.issues.value).toEqual([])
  })

  it('never lets an invalid document out: no download, no link, and no 17th layer', async () => {
    studio.commit(studio.ops.color(studio.doc.value, 0, 'not a colour'))
    expect(studio.exportProblem()).toContain('$.palette[0]')
    expect(studio.downloadDocument()).toBe(false)
    expect(await studio.shareLink()).toBeUndefined()
    studio.undo()
    expect(studio.exportProblem()).toBeUndefined()

    const before = studio.doc.value.layers.length
    for (let i = before; i < 20; i++) studio.layers.duplicate(0)
    expect(studio.doc.value.layers).toHaveLength(MAX_LAYERS)
    expect(studio.exportProblem()).toBeUndefined()
    expect(studio.ui.notices.at(-1)?.message).toContain(`at most ${MAX_LAYERS} layers`)
    for (let i = MAX_LAYERS; i > before; i--) studio.undo()
    expect(studio.doc.value.layers).toHaveLength(before)
  })

  it('derives a file name from the document name', () => {
    studio.apply(studio.ops.rename, 'Northern Lights · v2!')
    expect(studio.fileName.value).toBe('northern-lights-v2.aurora')
  })
})

describe('saving in place', () => {
  const disk = new Map<string, string>()
  const writes: string[] = []
  const workspace = {
    kind: 'folder' as const,
    label: 'site',
    files: () => Promise.resolve([...disk.keys()].sort()),
    read: (path: string) => Promise.resolve(disk.get(path)!),
    write: (path: string, text: string) => {
      writes.push(path)
      disk.set(path, text)
      return Promise.resolve()
    },
  }

  it('opens a file, saves edits back to it, and never rewrites an unchanged one', async () => {
    disk.set('hero.aurora', '{\n"format": "aurora", "version": 1, "name": "Hand formatted", "palette": ["#123456"], "layers": [{ "type": "aurora-fbm" }]\n}\n')
    studio.project.workspace = workspace
    await studio.refreshFiles()
    expect(studio.project.files).toEqual(['hero.aurora'])
    await studio.openProjectFile('hero.aurora')
    expect(studio.project.current).toBe('hero.aurora')
    expect(await studio.saveToProject()).toBe(true)
    expect(writes).toEqual([])
    expect(studio.ui.notices.at(-1)?.message).toBe('No changes to save in hero.aurora')
    studio.apply(studio.ops.rename, 'Renamed')
    expect(studio.dirty.value).toBe(true)
    await studio.saveToProject()
    expect(writes).toEqual(['hero.aurora'])
    expect(JSON.parse(disk.get('hero.aurora')!)).toMatchObject({ name: 'Renamed' })
    expect(studio.dirty.value).toBe(false)
  })

  it('saves as a new file in the folder, then saves there', async () => {
    await studio.saveAs('scenes/dusk')
    expect(studio.project.current).toBe('scenes/dusk.aurora')
    expect(studio.project.files).toEqual(['hero.aurora', 'scenes/dusk.aurora'])
  })

  it('refuses to write a document that wouldn\'t load', async () => {
    writes.length = 0
    studio.commit(studio.ops.color(studio.doc.value, 0, 'nope'))
    await studio.saveToProject()
    expect(writes).toEqual([])
    expect(studio.ui.notices.at(-1)).toMatchObject({ tone: 'error', message: 'Not saved: $.palette[0] "nope" is not a colour. Use oklch(L C H), oklab(L a b), color(srgb|display-p3 r g b) or #hex.' })
  })

  it('reports that there is nowhere to save once closed, so ⌘S falls back', async () => {
    studio.disconnect()
    expect(await studio.saveToProject()).toBe(false)
  })
})
