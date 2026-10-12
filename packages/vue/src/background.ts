import { compileCss, isAuroraModule } from '@goatsoft/aurora'
import type { AuroraMode, AuroraSource } from '@goatsoft/aurora'
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import type { PropType, SlotsType, VNode } from 'vue'
import { useAurora } from './use-aurora'

const HOST = 'position:absolute;inset:0;overflow:hidden;pointer-events:none'

/**
 * `<AuroraBackground :src="hero" />` fills its positioned parent with an Aurora background.
 *
 * `src` is an imported `.aurora` module (best: validated at build time, CSS inlined), a document,
 * or a URL. On the server it renders the CSS fallback, so the first paint already has the
 * background; in the browser WebGPU takes over without a flash. The default slot receives `mode`.
 */
export const AuroraBackground = defineComponent({
  name: 'AuroraBackground',
  props: {
    src: { type: [Object, String] as PropType<AuroraSource | string>, required: true },
    /** Join a named scene (defaults to the nearest `<AuroraScene>`). */
    scene: { type: String as PropType<string | undefined>, default: undefined },
  },
  emits: {
    modeChange: (mode: AuroraMode) => typeof mode === 'string',
    error: (error: Error) => error instanceof Error,
  },
  slots: Object as SlotsType<{ default?: (props: { mode: AuroraMode }) => VNode[] }>,
  setup(props, { emit, slots, expose }) {
    const host = ref<HTMLElement>()
    const hydrated = ref(false)
    const { mode, surface } = useAurora(host, () => props.src, {
      scene: () => props.scene,
      onError: (error) => emit('error', error),
    })
    watch(mode, (next) => emit('modeChange', next))
    expose({ mode, surface })

    // Server and first client render: the fallback as plain CSS, so it is in the HTML.
    const fallback = computed(() => {
      const src = props.src
      if (typeof src === 'string') return undefined
      const css = isAuroraModule(src) ? src.css : compileCss(src)
      return `position:absolute;inset:-10%;${css.style}`
    })
    // mountAurora paints its own fallback synchronously, so drop ours in the same task.
    onMounted(() => {
      hydrated.value = true
    })

    return () => h('div', { 'ref': host, 'class': 'aurora-background', 'aria-hidden': 'true', 'style': HOST, 'data-aurora-ssr': hydrated.value ? undefined : '' }, [
      !hydrated.value && fallback.value ? h('div', { style: fallback.value }) : null,
      slots.default?.({ mode: mode.value }),
    ])
  },
})
