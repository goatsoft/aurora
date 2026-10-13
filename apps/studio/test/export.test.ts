import { assertAurora } from '@goatsoft/aurora-format'
import { describe, expect, it } from 'vitest'
import { starter } from '@/editor/document'
import { snippets } from '@/editor/export'

const doc = assertAurora(starter())
const vue = (fileName: string) => snippets(fileName, doc).find((s) => s.id === 'vue')!.code

describe('export snippets', () => {
  it.each(['123.aurora', 'default.aurora', 'my-hero.aurora', 'class.aurora'])('imports %s under a valid identifier', (fileName) => {
    expect(vue(fileName)).toContain(`import background from './${fileName}'`)
    expect(vue(fileName)).toContain(':src="background"')
  })
})
