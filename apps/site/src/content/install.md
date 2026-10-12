::: code-group

```vue [Vue]
<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import hero from './hero.aurora' // validated and typed at build time
</script>

<template>
  <section class="relative">
    <AuroraBackground :src="hero" /> <!-- [!code highlight] -->
    <h1>Your headline</h1>
  </section>
</template>
```

```html [HTML]
<script type="module">
  import '@goatsoft/aurora/element'
</script>

<section style="position: relative">
  <aurora-bg src="/hero.aurora"></aurora-bg> <!-- [!code highlight] -->
  <h1>Your headline</h1>
</section>
```

```ts [vite.config.ts]
import aurora from '@goatsoft/aurora-unplugin/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), aurora()], // [!code highlight]
})
```

:::
