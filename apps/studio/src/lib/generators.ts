import type { Component } from 'vue'
import Binary from '~icons/hugeicons/binary-code'
import Blend from '~icons/hugeicons/blend'
import Circle from '~icons/hugeicons/circle'
import CircleDot from '~icons/hugeicons/circle-dot'
import Cloud from '~icons/hugeicons/cloud'
import CloudRain from '~icons/hugeicons/cloud-angled-rain'
import CloudZap from '~icons/hugeicons/cloud-angled-zap'
import Curtains from '~icons/hugeicons/curtains'
import Droplet from '~icons/hugeicons/droplet'
import FastWind from '~icons/hugeicons/fast-wind'
import Fire from '~icons/hugeicons/fire'
import Grid from '~icons/hugeicons/grid'
import Layers from '~icons/hugeicons/layers-01'
import Monitor from '~icons/hugeicons/monitor'
import Mountain from '~icons/hugeicons/mountain'
import MountainSnow from '~icons/hugeicons/mountain-snow'
import NoSignal from '~icons/hugeicons/no-signal'
import PaintBoard from '~icons/hugeicons/paint-board'
import PaintBrush from '~icons/hugeicons/paint-brush-04'
import PineTree from '~icons/hugeicons/pine-tree'
import Pulse from '~icons/hugeicons/pulse-02'
import Radar from '~icons/hugeicons/radar-02'
import Sparkles from '~icons/hugeicons/sparkles'
import Star from '~icons/hugeicons/star'

const ICONS: Record<string, Component> = {
  'aurora-fbm': Sparkles,
  'mesh-gradient': PaintBoard,
  'linear-sweep': PaintBrush,
  'linear-gradient': Blend,
  'conic': Circle,
  'grain': Grid,
  'digital-rain': Binary,
  'glitch': CloudZap,
  'static': NoSignal,
  'radar': Radar,
  'ping': Pulse,
  'scanlines': Monitor,
  'phosphor': CircleDot,
  'strata': Mountain,
  'mountains': MountainSnow,
  'treeline': PineTree,
  'clouds': Cloud,
  'wind': FastWind,
  'rain': CloudRain,
  'lightning': CloudZap,
  'fire': Fire,
  'water': Droplet,
  'starfield': Star,
  'curtain': Curtains,
}

/** The icon for a generator; registered generators get a generic one. */
export const generatorIcon = (id: string): Component => ICONS[id] ?? Layers

/** How the generator picker groups the built-ins. */
export const GENERATOR_GROUPS: { label: string, ids: string[] }[] = [
  { label: 'Aurora', ids: ['aurora-fbm', 'curtain', 'starfield'] },
  { label: 'Elements', ids: ['strata', 'mountains', 'treeline', 'clouds', 'wind', 'rain', 'lightning', 'fire', 'water'] },
  { label: 'Gradients', ids: ['mesh-gradient', 'linear-gradient', 'linear-sweep', 'conic', 'grain'] },
  { label: 'Tech', ids: ['digital-rain', 'glitch', 'static', 'radar', 'ping', 'scanlines', 'phosphor'] },
]
