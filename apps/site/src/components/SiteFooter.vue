<script setup lang="ts">
import { SITE } from '@/head'
import badge from '~/assets/brand/badges/v1/made-with-inline-auto.svg?url'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="relative mt-24 border-t border-border/60">
    <div class="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <div class="flex items-center gap-2.5">
          <Mark :size="28" />
          <span class="text-lg font-bold tracking-tight text-foreground">Aurora</span>
        </div>
        <p class="mt-3 max-w-xs text-sm text-pretty text-muted-foreground">
          Animated WebGPU backgrounds with a CSS fallback. Made by <a
            href="https://goatsoft.io"
            target="_blank"
            rel="noopener"
            class="hover:text-foreground"
          >GOATsoft</a>.
        </p>
        <p class="mt-3 max-w-xs text-xs/relaxed text-muted-foreground">
          Code, docs and presets: MIT. The Aurora name and mark have <a
            :href="`${SITE.repo}/blob/develop/LICENSE-ART.md`"
            target="_blank"
            rel="noopener"
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
              to="/gallery"
              class="hover:text-foreground"
            >
              Gallery
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
              to="/docs/guide/accessibility"
              class="hover:text-foreground"
            >
              Accessibility
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
              target="_blank"
              rel="noopener"
              class="hover:text-foreground"
            >JSON Schema</a>
          </li>
          <li>
            <RouterLink
              to="/docs/guide/attribution"
              class="hover:text-foreground"
            >
              Attribution badges
            </RouterLink>
          </li>
          <li>
            <a
              :href="SITE.repo"
              target="_blank"
              rel="noopener"
              class="hover:text-foreground"
            >GitHub</a>
          </li>
          <li>
            <a
              :href="SITE.npm"
              target="_blank"
              rel="noopener"
              class="hover:text-foreground"
            >npm</a>
          </li>
        </ul>
      </div>
      <div>
        <h2 class="text-sm font-semibold">
          <a
            href="https://goatsoft.io"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 rounded-sm text-foreground outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span
              class="size-6 shrink-0 goatsoft-mark"
              aria-hidden="true"
            />
            <span>GOATsoft</span>
          </a>
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <a
              href="https://goatsoft.io"
              target="_blank"
              rel="noopener"
              class="hover:text-foreground"
            >goatsoft.io</a>
          </li>
          <li>
            <a
              href="https://goatsoft.io/#contact"
              target="_blank"
              rel="noopener"
              class="hover:text-foreground"
            >Contact</a>
          </li>
          <li>
            <a
              :href="`${SITE.repo}/issues`"
              target="_blank"
              rel="noopener"
              class="hover:text-foreground"
            >Issues</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="mx-auto flex max-w-6xl flex-col items-start gap-4 border-t border-border/60 p-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
      <span>© {{ year }} <a
        href="https://goatsoft.io"
        target="_blank"
        rel="noopener"
        class="hover:text-foreground"
      >GOATsoft</a>. <a
        :href="`${SITE.repo}/blob/develop/LICENSE`"
        target="_blank"
        rel="noopener"
        class="hover:text-foreground"
      >MIT licence</a> · <a
        :href="`${SITE.repo}/blob/develop/LICENSE-ART.md`"
        target="_blank"
        rel="noopener"
        class="hover:text-foreground"
      >Artwork licence</a></span>
      <a
        :href="SITE.url"
        class="inline-flex shrink-0 rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <img
          :src="badge"
          alt="Made with Aurora"
          width="148"
          height="32"
          decoding="async"
        >
      </a>
    </div>
  </footer>
</template>
