import type { BadgeOptions } from '@goatsoft/aurora/badge'
import { auroraBadge } from '@goatsoft/aurora/badge'

export function badgeSnippet(options: Required<Pick<BadgeOptions, 'label' | 'layout' | 'theme' | 'animated'>>) {
  const { label, layout, theme, animated } = options
  const badge = auroraBadge(options)
  const vue = `<AuroraBadge label="${label}" layout="${layout}" theme="${theme}"${animated ? ' animated' : ''} />`
  const snippets = {
    Vue: `<script setup lang="ts">\nimport { AuroraBadge } from '@goatsoft/aurora-vue/badge'\n\x3c/script>\n\n<template>\n  ${vue}\n</template>`,
    HTML: `<a href="${badge.href}">\n  <img src="${badge.src}"\n    alt="${badge.alt}" width="${badge.width}" height="${badge.height}">\n</a>`,
    Markdown: `[![${badge.alt}](${badge.src})](${badge.href})`,
  }
  return snippets
}
