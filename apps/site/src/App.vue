<script setup lang="ts">
import { provideSitePreferences } from '@/lib/preferences'

provideSitePreferences()
</script>

<template>
  <div class="relative isolate min-h-dvh overflow-x-clip bg-background text-foreground">
    <a
      href="#main-content"
      class="sr-only fixed top-3 left-3 z-100 rounded-xl bg-background p-4 text-foreground focus:not-sr-only focus:outline-2 focus:outline-ring"
    >Skip to content</a>
    <SiteNav />
    <RouterView />
    <SiteFooter />
  </div>
</template>
