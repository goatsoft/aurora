import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { starter } from '@/editor/document'
import { decodeShare, encodeShare } from '@/editor/share'

describe('share links', () => {
  it('round-trips a document through the URL hash', async () => {
    const doc = starter()
    const hash = await encodeShare(doc)
    expect(hash).toMatch(/^a=[\w-]+$/)
    expect(await decodeShare(`#${hash}`)).toEqual(doc)
  })

  it('round-trips any JSON-safe document', async () => {
    await fc.assert(fc.asyncProperty(fc.string(), fc.array(fc.string(), { minLength: 1 }), async (name, palette) => {
      const doc = { ...starter(), name, palette }
      expect(await decodeShare(await encodeShare(doc))).toEqual(doc)
    }), { numRuns: 50 })
  })

  it('ignores hashes that are not Studio links or are damaged', async () => {
    expect(await decodeShare('#section-2')).toBeUndefined()
    expect(await decodeShare('#a=not*base64')).toBeUndefined()
    expect(await decodeShare('#a=AAAA')).toBeUndefined()
  })
})
