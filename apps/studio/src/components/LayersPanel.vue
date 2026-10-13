<script setup lang="ts">
import type { Generator } from '@goatsoft/aurora'
import { newLayer } from '@/editor/document'
import { useStudio } from '@/editor/studio'
import { GENERATOR_GROUPS, generatorIcon } from '@/lib/generators'
import { generatorThumb, layerThumb } from '@/lib/thumb'

/**
 * Layers, top first like every design tool (the file lists them bottom first). Drag a row to
 * reorder; hover (or select) a row to hide or delete it. Thumbnails are each layer's CSS fallback: instant.
 */
const studio = useStudio()
const { ui } = studio
const ROW = 52

const rows = computed(() => {
  const doc = studio.rendered.value
  return doc.layers.map((layer, index) => {
    const generator = studio.generator(layer.type)
    return {
      index,
      id: studio.layerIds.value[index]!,
      label: generator?.label ?? layer.type,
      icon: generatorIcon(layer.type),
      detail: [layer.blend === 'normal' ? undefined : layer.blend, layer.opacity < 1 ? `${Math.round(layer.opacity * 100)}%` : undefined, layer.mask ? 'masked' : undefined].filter(Boolean).join(' · ') || (generator?.description.split(':')[0] ?? 'Layer'),
      thumb: layerThumb(doc, layer),
    }
  }).reverse()
})

// Drag to reorder: the dragged row follows the pointer, the others slide out of its way.
const drag = reactive({ id: undefined as number | undefined, from: 0, to: 0, dy: 0, startY: 0 })
function down(event: PointerEvent, row: { index: number, id: number }) {
  if ((event.target as HTMLElement).closest('button')) return
  ui.layer = row.index
  drag.id = row.id
  drag.from = rows.value.findIndex((r) => r.id === row.id)
  drag.to = drag.from
  drag.startY = event.clientY
  drag.dy = 0
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function move(event: PointerEvent) {
  if (drag.id === undefined) return
  drag.dy = event.clientY - drag.startY
  drag.to = Math.max(0, Math.min(rows.value.length - 1, drag.from + Math.round(drag.dy / ROW)))
}
function up() {
  if (drag.id === undefined) return
  const n = rows.value.length
  // Rows are shown top first; the document lists bottom first.
  if (drag.to !== drag.from) studio.layers.move(n - 1 - drag.from, n - 1 - drag.to)
  drag.id = undefined
}
function offset(position: number, id: number) {
  if (drag.id === undefined) return 0
  if (id === drag.id) return drag.dy
  if (drag.from < drag.to && position > drag.from && position <= drag.to) return -ROW
  if (drag.from > drag.to && position < drag.from && position >= drag.to) return ROW
  return 0
}

function toggleMute(id: number) {
  if (ui.muted.has(id)) ui.muted.delete(id)
  else ui.muted.add(id)
}

const picker = ref(false)
/** "Earth: flowing sandstone…" → "Flowing sandstone…": the group already says which element. */
const blurb = (text: string) => text.replace(/^\w+( in motion)?: (\w)/, (_, __, c: string) => c.toUpperCase())
const groups = computed(() => {
  const all = studio.generators.value
  const known = new Set(GENERATOR_GROUPS.flatMap((g) => g.ids))
  const grouped = GENERATOR_GROUPS.map((group) => ({ label: group.label, items: group.ids.map((id) => all.find((g) => g.id === id)).filter((g): g is Generator => !!g) }))
  const custom = all.filter((g) => !known.has(g.id))
  return custom.length ? [...grouped, { label: 'Registered', items: custom }] : grouped
})

/** Adds a generator above the selected layer, bringing its own palette so it looks right at once. */
function add(generator: Generator) {
  let doc = studio.doc.value
  const colors = generator.palette.slice(0, generator.colors).map((css) => {
    const existing = doc.palette.indexOf(css)
    if (existing >= 0) return existing
    if (doc.palette.length >= 16) return 0
    doc = studio.ops.addColor(doc, css)
    return doc.palette.length - 1
  })
  studio.layers.add(newLayer(generator.id, colors), Math.min(doc.layers.length, ui.layer + 1), doc)
  picker.value = false
  studio.notify(`Added ${generator.label}`)
}
</script>

<template>
  <!-- A floating panel on the left; on phones, a sheet above the bottom bar. -->
  <aside
    v-show="!ui.focus"
    class="absolute top-20 left-4 z-20 flex max-h-[calc(100%-11rem)] w-[268px] animate-[rise-in_400ms_cubic-bezier(0.2,0.9,0.1,1)] flex-col overflow-hidden rounded-2xl glass max-md:inset-x-2 max-md:top-auto max-md:bottom-19 max-md:max-h-[55svh] max-md:w-auto"
    :class="ui.sheet !== 'layers' && 'max-md:hidden'"
  >
    <header class="flex h-11 shrink-0 items-center justify-between pr-1.5 pl-3.5">
      <h2 class="flex items-center gap-2 text-xs font-semibold">
        <IHgLayers01 class="size-4 text-muted-foreground" />Layers
      </h2>
      <Popover
        v-model:open="picker"
        side="right"
        align="start"
        class="w-[360px] p-2"
      >
        <template #trigger>
          <Button
            size="icon-sm"
            aria-label="Add layer"
          >
            <IHgAdd01 />
          </Button>
        </template>
        <div class="flex max-h-[70vh] flex-col gap-3 overflow-y-auto p-1">
          <div
            v-for="group in groups"
            :key="group.label"
          >
            <h3 class="mb-1.5 px-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {{ group.label }}
            </h3>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="generator in group.items"
                :key="generator.id"
                class="group flex flex-col overflow-hidden rounded-lg bg-input text-left ring-1 ring-transparent transition-all outline-none hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-ring"
                @click="add(generator)"
              >
                <div class="relative h-16 overflow-hidden bg-[oklch(0.13_0.02_270)]">
                  <div
                    class="absolute inset-[-10%] transition-transform duration-700 group-hover:scale-110"
                    :style="generatorThumb(generator)"
                  />
                </div>
                <div class="flex items-start gap-2 px-2 py-1.5">
                  <component
                    :is="generatorIcon(generator.id)"
                    class="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                  />
                  <div class="min-w-0">
                    <p class="text-xs font-medium">
                      {{ generator.label }}
                    </p>
                    <p class="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                      {{ blurb(generator.description) }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Popover>
    </header>

    <ol
      class="relative overflow-y-auto px-1.5 pb-1.5"
      :style="{ height: `${rows.length * ROW + 6}px` }"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
    >
      <li
        v-for="(row, position) in rows"
        :key="row.id"
        class="group absolute inset-x-1.5 flex h-[48px] cursor-grab items-center gap-2.5 rounded-xl px-1.5 transition-[background-color,box-shadow] active:cursor-grabbing"
        :class="[
          ui.layer === row.index ? 'bg-accent shadow-[0_0_0_1px_oklch(1_0_0/0.08)_inset]' : 'hover:bg-[oklch(1_0_0/0.04)]',
          drag.id === row.id ? 'z-10 shadow-xl' : 'transition-transform duration-200 ease-[cubic-bezier(0.2,0.9,0.1,1)]',
          ui.muted.has(row.id) && 'opacity-45',
        ]"
        :style="{ top: `${position * ROW}px`, transform: `translateY(${offset(position, row.id)}px)` }"
        @pointerdown="down($event, row)"
      >
        <div class="relative size-9 shrink-0 overflow-hidden rounded-lg bg-[oklch(0.13_0.02_270)] ring-1 ring-panel-border">
          <div
            class="absolute inset-[-10%]"
            :style="row.thumb"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="flex items-center gap-1.5 truncate text-xs font-medium">
            <component
              :is="row.icon"
              class="size-3.5 shrink-0 text-muted-foreground"
            />
            {{ row.label }}
          </p>
          <p class="truncate text-[11px] text-muted-foreground">
            {{ row.detail }}
          </p>
        </div>
        <div
          class="flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100"
          :class="(ui.muted.has(row.id) || ui.layer === row.index) && 'opacity-100'"
        >
          <Tip
            :label="ui.muted.has(row.id) ? 'Show' : 'Hide'"
            keys="M"
          >
            <Button
              size="icon-sm"
              :aria-label="`${ui.muted.has(row.id) ? 'Show' : 'Hide'} ${row.label}`"
              @click="toggleMute(row.id)"
            >
              <IHgViewOffSlash v-if="ui.muted.has(row.id)" />
              <IHgEye v-else />
            </Button>
          </Tip>
          <Tip
            label="Delete"
            keys="⌫"
          >
            <Button
              size="icon-sm"
              class="hover:text-[oklch(0.75_0.15_25)]"
              :aria-label="`Delete ${row.label}`"
              :disabled="rows.length === 1"
              @click="studio.layers.remove(row.index)"
            >
              <IHgDelete02 />
            </Button>
          </Tip>
        </div>
      </li>
    </ol>
  </aside>
</template>
