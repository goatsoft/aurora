<script setup lang="ts">
import { SITE } from '@/head'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="relative mt-24 border-t border-border/60">
    <div class="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <div class="flex items-center gap-2.5">
          <Mark :size="28" />
          <span class="text-brand text-lg font-bold tracking-tight">Aurora</span>
        </div>
        <p class="mt-3 max-w-xs text-sm text-pretty text-muted-foreground">
          WebGPU backgrounds that feel alive, and a CSS fallback for everyone else. Made by GOATsoft, in the open.
        </p>
        <p class="mt-3 max-w-xs text-xs/relaxed text-muted-foreground">
          Code, docs and presets: MIT. The Aurora name and mark have <a
            :href="`${SITE.repo}/blob/develop/LICENSE-ART.md`"
            class="underline underline-offset-2 hover:text-foreground"
          >separate terms</a>.
        </p>
      </div>
      <div>
        <h2 class="text-sm font-semibold">
          Product
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <a
              href="/studio/"
              class="hover:text-foreground"
            >Aurora Studio</a>
          </li>
          <li>
            <RouterLink
              to="/#elements"
              class="hover:text-foreground"
            >
              Generators
            </RouterLink>
          </li>
          <li>
            <RouterLink
              to="/docs/generators"
              class="hover:text-foreground"
            >
              Generator reference
            </RouterLink>
          </li>
        </ul>
      </div>
      <div>
        <h2 class="text-sm font-semibold">
          Developers
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <RouterLink
              to="/docs"
              class="hover:text-foreground"
            >
              Documentation
            </RouterLink>
          </li>
          <li>
            <RouterLink
              to="/docs/guide/format"
              class="hover:text-foreground"
            >
              The .aurora format
            </RouterLink>
          </li>
          <li>
            <a
              href="/schema/v1.json"
              class="hover:text-foreground"
            >JSON Schema</a>
          </li>
          <li>
            <a
              :href="SITE.repo"
              class="hover:text-foreground"
            >GitHub</a>
          </li>
        </ul>
      </div>
      <div>
        <h2 class="text-sm font-semibold">
          GOATsoft
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <a
              href="https://goatsoft.io"
              class="hover:text-foreground"
            >goatsoft.io</a>
          </li>
          <li>
            <a
              href="mailto:bleet@goatsoft.io"
              class="hover:text-foreground"
            >Contact</a>
          </li>
          <li>
            <a
              :href="`${SITE.repo}/issues`"
              class="hover:text-foreground"
            >Issues</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="mx-auto flex max-w-6xl flex-col gap-2 border-t border-border/60 p-6 text-xs text-muted-foreground md:flex-row md:justify-between">
      <span>© {{ year }} GOATsoft. <a
        :href="`${SITE.repo}/blob/develop/LICENSE`"
        class="hover:text-foreground"
      >MIT licence</a> · <a
        :href="`${SITE.repo}/blob/develop/LICENSE-ART.md`"
        class="hover:text-foreground"
      >Artwork licence</a></span>
      <span>Built with Aurora and gruff.</span>
    </div>
  </footer>
</template>
