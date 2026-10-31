---
'@goatsoft/color': patch
'@goatsoft/aurora-format': patch
'@goatsoft/aurora': patch
'@goatsoft/aurora-vue': patch
'@goatsoft/aurora-unplugin': patch
---

Leave the workspace-only `@goatsoft/source` export condition out of the published `package.json`. It pointed at `src/`, which isn't published, so a project that turned the condition on (for its own workspace packages) could not resolve these packages.
