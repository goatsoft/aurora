---
'@goatsoft/aurora': minor
'@goatsoft/aurora-vue': minor
---

Add phase-preserving playback controls: `surface.pause()` / `resume()`, a Vue `paused` prop and composable option, and the custom element's boolean `paused` attribute. Paused backgrounds and documents with speed zero redraw only when their state changes. Studio uses playback state without replacing the authored speed.
