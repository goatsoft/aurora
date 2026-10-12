import { describe, expect, it } from 'vitest'
import { newLayer } from '@/editor/document'
import { useStudio } from '@/editor/studio'

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

  it('hides muted layers in the preview only, and solo shows one layer', () => {
    const [grain, aurora] = studio.layerIds.value
    studio.ui.muted.add(grain!)
    expect(studio.preview.value.layers.map((l) => l.opacity)).toEqual([0, 1])
    expect(studio.file.value).not.toContain('"opacity"')
    studio.ui.muted.clear()
    studio.ui.solo = aurora
    expect(studio.preview.value.layers.map((l) => l.opacity)).toEqual([0, 1])
    studio.ui.solo = undefined
  })

  it('pauses by freezing time in the preview, without touching the document', () => {
    studio.ui.playing = false
    expect(studio.preview.value.motion.speed).toBe(0)
    expect(studio.rendered.value.motion.speed).toBe(1)
    studio.ui.playing = true
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

  it('derives a file name from the document name', () => {
    studio.apply(studio.ops.rename, 'Northern Lights · v2!')
    expect(studio.fileName.value).toBe('northern-lights-v2.aurora')
  })
})
