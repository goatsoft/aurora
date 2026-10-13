import type { AuroraModule } from '@goatsoft/aurora'
import type { AuroraDocument } from '@goatsoft/aurora-format'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { encodeShare } from '@goatsoft/aurora-editor-ui'
import { onMounted, ref, toValue, watch } from 'vue'

/**
 * A link that opens a background in Studio as a share link, with the whole document in the hash.
 * It is `/studio/` until the page has started (encoding needs CompressionStream, so it runs in
 * the browser), then the full link.
 */
export function useStudioHref(src: MaybeRefOrGetter<AuroraModule | AuroraDocument>): Ref<string> {
  const href = ref('/studio/')
  onMounted(() => {
    watch(() => toValue(src), async (value) => {
      href.value = `/studio/#${await encodeShare('doc' in value ? value.doc : value)}`
    }, { immediate: true })
  })
  return href
}
