import type { AuroraDocument } from '@goatsoft/aurora-format'
import { compileCss } from '@goatsoft/aurora'

/** Downloads text as a file. */
export function download(name: string, text: string | Blob, type = 'application/json'): void {
  const url = URL.createObjectURL(typeof text === 'string' ? new Blob([text], { type }) : text)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Ready-to-paste usage for each binding. The Vue import is always called `background`: a name made
 * from the file name could be a number (`123.aurora`) or a reserved word (`default.aurora`).
 */
export function snippets(fileName: string, doc: AuroraDocument): { id: string, label: string, code: string }[] {
  const name = 'background'
  const css = compileCss(doc)
  return [
    {
      id: 'vue',
      label: 'Vue',
      code: `<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import ${name} from './${fileName}'
</script>

<template>
  <section style="position: relative">
    <AuroraBackground :src="${name}" />
    <!-- your content -->
  </section>
</template>
`,
    },
    {
      id: 'html',
      label: 'HTML',
      code: `<script type="module">import '@goatsoft/aurora/element'</script>

<section style="position: relative">
  <aurora-bg src="/${fileName}"></aurora-bg>
  <!-- your content -->
</section>
`,
    },
    {
      id: 'css',
      label: 'CSS only',
      code: `/* The CSS fallback on its own: no JavaScript, no WebGPU. */
.aurora {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.aurora::before {
  content: "";
  position: absolute;
  inset: -10%;
  background-image: ${css.backgroundImage};
  background-blend-mode: ${css.backgroundBlendMode};${css.maskImage ? `\n  mask-image: ${css.maskImage};` : ''}
}
`,
    },
  ]
}
