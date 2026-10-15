<script setup lang="ts">
import { SITE } from '@/head'
import { useSitePreferences } from '@/lib/preferences'

const { paused, toggleMotion } = useSitePreferences()
const { y } = useWindowScroll()
const scrolled = computed(() => y.value > 24)
const open = ref(false)
const links = [
  { label: 'Features', to: '/#features' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Studio', to: '/#studio' },
  { label: 'Docs', to: '/docs' },
]
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 py-3 transition-[padding] duration-500"
    :class="scrolled ? 'md:py-2' : 'md:py-4'"
  >
    <div
      class="relative mx-auto max-w-6xl px-4"
      @keydown.esc="open = false"
    >
      <nav
        class="flex items-center justify-between rounded-full py-2 pr-2 pl-4 transition-all duration-500"
        :class="scrolled ? 'border border-border bg-surface shadow-[0_10px_40px_-20px_oklch(0_0_0/0.4)]' : 'border border-border bg-background'"
        aria-label="Main"
      >
        <RouterLink
          to="/"
          class="flex items-center gap-2.5"
          aria-label="Aurora home"
        >
          <Mark
            :size="32"
          />
          <span class="text-lg font-bold tracking-tight text-foreground">Aurora</span>
        </RouterLink>
        <div
          class="hidden items-center gap-7 text-sm md:flex"
          :class="scrolled ? 'text-muted-foreground' : 'text-foreground'"
        >
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="transition-colors hover:text-foreground"
          >
            {{ link.label }}
          </RouterLink>
        </div>
        <div class="flex items-center gap-1.5">
          <ThemeSelect />
          <button
            type="button"
            class="inline-flex size-11 items-center justify-center rounded-full hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-5"
            :aria-label="paused ? 'Resume animations' : 'Pause animations'"
            :title="paused ? 'Resume animations' : 'Pause animations'"
            :aria-pressed="paused"
            @click="toggleMotion"
          >
            <IHgPlay
              v-if="paused"
              aria-hidden="true"
            />
            <IHgPause
              v-else
              aria-hidden="true"
            />
          </button>
          <Button
            variant="ghost"
            size="icon"
            as="a"
            :href="SITE.repo"
            target="_blank"
            rel="noopener"
            aria-label="Aurora on GitHub"
            class="hidden md:inline-flex"
          >
            <ISiGithub />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            as="a"
            :href="SITE.npm"
            target="_blank"
            rel="noopener"
            aria-label="Aurora on npm"
            class="hidden md:inline-flex"
          >
            <ISiNpm />
          </Button>
          <Button
            size="sm"
            as="a"
            href="/studio/"
            class="hidden sm:inline-flex"
          >
            <IHgPaintBoard /> Open Studio
          </Button>
          <button
            type="button"
            class="inline-flex size-11 items-center justify-center rounded-full border border-border bg-background md:hidden [&_svg]:size-5"
            :aria-label="open ? 'Close menu' : 'Open menu'"
            :aria-expanded="open"
            aria-controls="mobile-navigation"
            @click="open = !open"
          >
            <IHgMenu01 v-if="!open" /><IHgCancel01 v-else />
          </button>
        </div>
      </nav>
      <nav
        v-if="open"
        id="mobile-navigation"
        aria-label="Mobile"
        class="absolute inset-x-4 top-full mt-2 flex flex-col gap-1 rounded-2xl border border-border bg-surface p-2 text-foreground shadow-xl md:hidden"
      >
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="flex min-h-12 items-center rounded-xl px-4 text-base active:bg-white/5"
          @click="open = false"
        >
          {{ link.label }}
        </RouterLink>
        <a
          href="/studio/"
          class="flex min-h-12 items-center rounded-xl px-4 text-base text-primary"
        >Open Studio</a>
      </nav>
    </div>
  </header>
</template>
