/**
 * Editor controls and helpers shared by Aurora Studio and the site: the scrubbable number field,
 * value snapping, and share links (a document deflated into the URL hash, `#a=…`). Components use
 * Tailwind classes and the apps' theme tokens (`input`, `accent`, `primary`, `muted-foreground`,
 * `ring`), so each app's stylesheet adds this folder with `@source`.
 */
export { default as ScrubField } from './ScrubField.vue'
export { decodeShare, encodeShare } from './share'
export { snap } from './snap'
