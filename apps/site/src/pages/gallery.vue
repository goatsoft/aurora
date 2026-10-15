<script setup lang="ts">
import { AuroraBackground } from '@goatsoft/aurora-vue'
import galleryHero from '@/backgrounds/gallery-hero.aurora'
import { useHead } from '@/head'
import { galleryGroups } from '@/lib/gallery'
import { sceneGroups } from '@/lib/gallery-scenes'
import { useSitePreferences } from '@/lib/preferences'

useHead({ title: 'Gallery', description: 'Explore finished multi-layer scenes and animated generators: night skies, landscapes, weather and Tech. Make any background yours in Aurora Studio.' })

const { paused: sitePaused } = useSitePreferences()
</script>

<template>
  <main
    id="main-content"
    tabindex="-1"
  >
    <section
      aria-label="Gallery introduction"
      class="relative isolate overflow-hidden"
    >
      <div
        class="pointer-events-none absolute inset-0 -z-20"
        aria-hidden="true"
      >
        <AuroraBackground
          :paused="sitePaused"
          :src="galleryHero"
        />
      </div>
      <div class="pointer-events-none absolute inset-0 -z-10 bg-background/55 sm:bg-linear-to-r sm:from-background/80 sm:via-background/50 sm:to-transparent" />
      <div class="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-b from-transparent to-background" />
      <div class="mx-auto flex min-h-140 max-w-6xl flex-col justify-center px-6 pt-32 pb-20 sm:min-h-160 sm:pt-40 sm:pb-24">
        <div class="max-w-3xl">
          <p class="eyebrow">
            The collection
          </p>
          <h1 class="mt-4 text-display font-semibold tracking-tight text-balance [text-shadow:0_2px_30px_oklch(0_0_0/0.6)]">
            Find your atmosphere.
          </h1>
          <p class="mt-6 text-lead text-pretty text-foreground">
            Start with a whole world. Explore finished scenes built from layers of light, landscape and signal, then discover the generators behind them.
          </p>
        </div>
        <nav
          aria-label="Gallery collections"
          class="mt-8 flex flex-wrap gap-2"
        >
          <a
            v-for="group in sceneGroups"
            :key="group.id"
            :href="`#${group.id}`"
            class="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-background/60 px-5 py-2 text-sm transition-colors hover:bg-background/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >{{ group.name }}</a>
          <a
            href="#modifiers"
            class="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-background/60 px-5 py-2 text-sm transition-colors hover:bg-background/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >Modifiers</a>
          <a
            href="#interactions"
            class="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-background/60 px-5 py-2 text-sm transition-colors hover:bg-background/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >Interactions</a>
          <a
            href="#generator-library"
            class="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-background/60 px-5 py-2 text-sm transition-colors hover:bg-background/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >Individual generators ↓</a>
        </nav>
      </div>
      <HeroControls
        :src="galleryHero"
        label="Prism sky"
        class="right-6 bottom-16"
      />
    </section>
    <div class="mx-auto max-w-6xl px-6 pb-12">
      <section
        v-for="group in sceneGroups"
        :id="group.id"
        :key="group.id"
        :aria-labelledby="`${group.id}-title`"
        class="scroll-mt-24 pt-16 sm:pt-24"
      >
        <div class="mb-8 border-t border-border pt-6">
          <p class="eyebrow">
            Finished scenes
          </p>
          <h2
            :id="`${group.id}-title`"
            class="mt-3 text-heading font-semibold tracking-tight"
          >
            {{ group.name }}
          </h2>
          <p class="mt-3 text-muted-foreground">
            {{ group.description }}
          </p>
        </div>
        <div class="grid gap-5 md:grid-cols-2">
          <GalleryScene
            v-for="item in group.scenes"
            :key="item.id"
            :scene="item.scene"
            :body="item.body"
          />
        </div>
      </section>
      <ModifiersSection embedded />
      <InteractionsSection />
      <div
        id="generator-library"
        class="scroll-mt-24 pt-20 sm:pt-32"
      >
        <p class="eyebrow">
          The building blocks
        </p>
        <h2 class="mt-4 text-heading font-semibold tracking-tight">
          Compose something of your own.
        </h2>
        <p class="mt-4 max-w-2xl text-lead text-muted-foreground">
          Every scene starts here. Combine these generators in Studio and shape their colour, motion and layers.
        </p>
      </div>
      <nav
        aria-label="Gallery types"
        class="mt-8 flex flex-wrap gap-2"
      >
        <a
          v-for="group in galleryGroups"
          :key="group.id"
          :href="`#${group.id}`"
          class="inline-flex min-h-11 items-center gap-3 rounded-full border border-border px-5 py-2 text-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {{ group.name }} <span class="text-muted-foreground">{{ group.cards.length }}</span>
        </a>
      </nav>
      <section
        v-for="group in galleryGroups"
        :id="group.id"
        :key="group.id"
        :aria-labelledby="`${group.id}-title`"
        class="scroll-mt-24 pt-16 sm:pt-24"
      >
        <div class="mb-8 border-t border-border pt-6">
          <h2
            :id="`${group.id}-title`"
            class="text-heading font-semibold tracking-tight"
          >
            {{ group.name }}
          </h2>
          <p class="mt-3 text-muted-foreground">
            {{ group.description }}
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="card in group.cards"
            :key="card.id"
            class="group relative overflow-hidden rounded-2xl border border-white/10 bg-surface/50"
          >
            <div class="relative aspect-4/3 overflow-hidden">
              <LazyBackground :src="card.scene" />
            </div>
            <div class="p-5">
              <h3 class="text-lg font-semibold">
                {{ card.name }}
              </h3>
              <p class="mt-2 min-h-15 text-sm/relaxed text-muted-foreground">
                {{ card.body }}
              </p>
              <RouterLink
                :to="`/docs/generators/${card.id}`"
                class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                Explore {{ card.name }} <span aria-hidden="true">↗</span>
              </RouterLink>
            </div>
            <EditInStudio
              :src="card.scene"
              :label="card.name"
            />
          </article>
        </div>
      </section>
    </div>
  </main>
</template>
