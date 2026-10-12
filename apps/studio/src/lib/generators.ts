import type { Component } from 'vue'
import Circle from '~icons/hugeicons/circle'
import Cloud from '~icons/hugeicons/cloud'
import Droplet from '~icons/hugeicons/droplet'
import FastWind from '~icons/hugeicons/fast-wind'
import Fire from '~icons/hugeicons/fire'
import Grid from '~icons/hugeicons/grid'
import Layers from '~icons/hugeicons/layers-01'
import Mountain from '~icons/hugeicons/mountain'
import PaintBoard from '~icons/hugeicons/paint-board'
import PaintBrush from '~icons/hugeicons/paint-brush-04'
import Sparkles from '~icons/hugeicons/sparkles'
import Star from '~icons/hugeicons/star'

const ICONS: Record<string, Component> = {
  'aurora-fbm': Sparkles,
  'mesh-gradient': PaintBoard,
  'linear-sweep': PaintBrush,
  'conic': Circle,
  'grain': Grid,
  'strata': Mountain,
  'clouds': Cloud,
  'wind': FastWind,
  'fire': Fire,
  'water': Droplet,
  'starfield': Star,
}

/** The icon for a generator; registered generators get a generic one. */
export const generatorIcon = (id: string): Component => ICONS[id] ?? Layers

/** How the generator picker groups the built-ins. */
export const GENERATOR_GROUPS: { label: string, ids: string[] }[] = [
  { label: 'Aurora', ids: ['aurora-fbm', 'starfield'] },
  { label: 'Elements', ids: ['strata', 'clouds', 'wind', 'fire', 'water'] },
  { label: 'Gradients', ids: ['mesh-gradient', 'linear-sweep', 'conic', 'grain'] },
]
