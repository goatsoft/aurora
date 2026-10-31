import type { FunctionalComponent, VNode } from 'vue'
import { h } from 'vue'

/** A 24px stroked icon in the current colour; a `class` passed to it lands on the `<svg>`. */
function icon(name: string, shapes: () => VNode[]): FunctionalComponent {
  const component: FunctionalComponent = () => h('svg', {
    'xmlns': 'http://www.w3.org/2000/svg',
    'viewBox': '0 0 24 24',
    'fill': 'none',
    'stroke': 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    'data-icon': name,
  }, shapes())
  component.displayName = `GruffIcon${name[0]!.toUpperCase()}${name.slice(1)}`
  return component
}

const path = (d: string) => h('path', { d })

/** The built-in icons: plain strokes, so they suit most sites until one passes its own. */
export const defaultIcons = {
  check: icon('check', () => [path('M20 6 9 17l-5-5')]),
  chevronDown: icon('chevronDown', () => [path('m6 9 6 6 6-6')]),
  chevronLeft: icon('chevronLeft', () => [path('m15 18-6-6 6-6')]),
  chevronRight: icon('chevronRight', () => [path('m9 18 6-6-6-6')]),
  copy: icon('copy', () => [h('rect', { x: 8, y: 8, width: 12, height: 12, rx: 2 }), path('M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2')]),
  search: icon('search', () => [h('circle', { cx: 11, cy: 11, r: 7 }), path('m20 20-3.5-3.5')]),
}
