# @goatsoft/aurora-vue

Vue 3 bindings for [Aurora](https://aurora.goatsoft.io): animated WebGPU backgrounds with a CSS fallback that is server-rendered into the first paint.

```sh
npm install @goatsoft/aurora @goatsoft/aurora-vue
npm install -D @goatsoft/aurora-unplugin
```

```vue
<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import hero from './hero.aurora'
</script>

<template>
  <section style="position: relative">
    <AuroraBackground :src="hero" />
    <h1>Your headline</h1>
  </section>
</template>
```

`<AuroraBackground>` fills its nearest positioned parent. Wrap sections in `<AuroraScene name="landing">` to make their backgrounds one continuous scene, or use `useAurora()` to drive a background yourself. `@goatsoft/aurora-vue/badge` exports `<AuroraBadge>`, an optional attribution badge.

## Links

- [Getting started with Vue](https://aurora.goatsoft.io/docs/guide/getting-started)
- [Shared backgrounds](https://aurora.goatsoft.io/docs/guide/shared-backgrounds)
- [Aurora Studio](https://aurora.goatsoft.io/studio/)
- [Source on GitHub](https://github.com/goatsoft/aurora)

## Licence

MIT. The Aurora name and mark have [separate terms](https://github.com/goatsoft/aurora/blob/main/LICENSE-ART.md).
