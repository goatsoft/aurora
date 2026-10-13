<script setup lang="ts">
import type { Preset } from '@/lib/presets'
import { compileCss } from '@goatsoft/aurora'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { useStudio } from '@/editor/studio'
import { PACKS } from '@/lib/presets'

/** Preset gallery. Cards show the CSS fallback; the hovered one comes alive on the GPU. */
const studio = useStudio()
const { ui } = studio
const pack = ref(PACKS[0]!.id)
const hovered = ref<string>()
const presets = computed(() => PACKS.find((p) => p.id === pack.value)!.presets)

function open(preset: Preset) {
  if (studio.open(preset.input, 'preset')) {
    ui.gallery = false
    studio.notify(`Opened ${preset.name}`)
  }
}
const thumb = (preset: Preset) => `position:absolute;inset:-10%;${compileCss(preset.doc).style}`
</script>

<template>
  <DialogRoot v-model:open="ui.gallery">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-[oklch(0.08_0.02_270/0.55)] backdrop-blur-sm data-[state=open]:animate-[pop-in_200ms_ease-out]" />
      <DialogContent class="fixed top-1/2 left-1/2 z-50 flex max-h-[82vh] w-[min(1040px,92vw)] -translate-1/2 flex-col overflow-hidden rounded-3xl glass outline-none data-[state=open]:animate-[rise-in_320ms_cubic-bezier(0.2,0.9,0.1,1)]">
        <header class="flex items-center justify-between gap-4 border-b border-panel-border px-5 py-4">
          <div>
            <DialogTitle class="text-sm font-semibold">
              Presets
            </DialogTitle>
            <DialogDescription class="text-xs text-muted-foreground">
              Open one to start from it. You can undo back to your document.
            </DialogDescription>
          </div>
          <Segmented
            v-model="pack"
            :options="PACKS.map((p) => ({ value: p.id, label: p.label }))"
            class="w-[300px]"
            size="sm"
          />
        </header>
        <div class="grid grid-cols-3 gap-3 overflow-y-auto p-5">
          <button
            v-for="preset in presets"
            :key="preset.id"
            class="group flex flex-col overflow-hidden rounded-2xl bg-input text-left ring-1 ring-panel-border transition-all duration-300 outline-none hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_oklch(0.68_0.16_245/0.5)] hover:ring-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
            @pointerenter="hovered = preset.id"
            @pointerleave="hovered === preset.id && (hovered = undefined)"
            @focus="hovered = preset.id"
            @click="open(preset)"
          >
            <div class="relative aspect-video overflow-hidden bg-[oklch(0.13_0.02_270)]">
              <div :style="thumb(preset)" />
              <AuroraBackground
                v-if="hovered === preset.id"
                :src="preset.doc"
              />
            </div>
            <div class="flex items-center justify-between px-3 py-2.5">
              <span class="text-xs font-medium">{{ preset.name }}</span>
              <span class="text-[10px] text-muted-foreground">{{ preset.doc.layers.length }} layer{{ preset.doc.layers.length === 1 ? '' : 's' }}</span>
            </div>
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
