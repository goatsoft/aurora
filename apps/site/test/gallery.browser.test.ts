import type { AuroraDocument } from '@goatsoft/aurora-format'
import { generatorIds } from '@goatsoft/aurora'
import { parseAurora } from '@goatsoft/aurora-format'
import { AuroraBackground } from '@goatsoft/aurora-vue'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GalleryScene from '@/components/GalleryScene.vue'
import ModifierCard from '@/components/ModifierCard.vue'
import ModifiersSection from '@/components/section/ModifiersSection.vue'
import ScenesSection from '@/components/section/ScenesSection.vue'
import { galleryGroups } from '@/lib/gallery'
import { sceneGroups } from '@/lib/gallery-scenes'
import { modifierCards } from '@/lib/modifiers'
import Gallery from '@/pages/gallery.vue'

const global = {
  stubs: { AuroraBackground: true, EditInStudio: true, RouterLink: RouterLinkStub },
  directives: { reveal: {} },
}

describe('gallery', () => {
  it('shows every built-in once, grouped by type, with a matching preview and reference', () => {
    const cards = galleryGroups.flatMap((group) => group.cards)
    expect(cards.map((card) => card.id).sort()).toEqual(generatorIds().sort())
    expect(galleryGroups.find((group) => group.id === 'tech')!.cards.map((card) => card.id)).toEqual(['digital-rain', 'glitch', 'static', 'radar', 'ping', 'scanlines', 'phosphor'])
    const wrapper = mount(Gallery, { global })
    try {
      expect(wrapper.findAll('section').filter((section) => galleryGroups.some((group) => section.attributes('id') === group.id)).reduce((count, section) => count + section.findAll('article').length, 0)).toBe(cards.length)
      expect(wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to'))).toEqual(cards.map((card) => `/docs/generators/${card.id}`))
      for (const group of galleryGroups) {
        expect(wrapper.get(`nav a[href="#${group.id}"]`).text()).toContain(group.name)
        const section = wrapper.get(`section#${group.id}`)
        expect(section.get('h2').text()).toBe(group.name)
        for (const card of group.cards) expect(card.scene.doc.layers.some((layer) => layer.type === card.id)).toBe(true)
      }
    } finally {
      wrapper.unmount()
    }
  })

  it('shows every finished scene once with its full composition and a Studio link', () => {
    const expected = Object.entries(import.meta.glob<string>('~/presets/scenes/*.aurora', { eager: true, query: '?raw', import: 'default' })).filter(([, text]) => {
      const result = parseAurora(text)
      return result.ok && result.doc.layers.length > 1
    }).map(([path]) => path.split('/').pop()!.replace('.aurora', '')).sort()
    const scenes = sceneGroups.flatMap((group) => group.scenes)
    expect(scenes.map((item) => item.id).sort()).toEqual(expected)
    const wrapper = mount(Gallery, { global })
    try {
      const previews = wrapper.findAllComponents(GalleryScene)
      expect(previews).toHaveLength(scenes.length)
      for (const [i, preview] of previews.entries()) {
        const scene = scenes[i]!.scene
        expect(preview.props('scene')).toEqual(scene)
        expect(scene.doc.layers.length).toBeGreaterThan(1)
        expect(preview.get('a').attributes('aria-label')).toBe(`Open ${scene.doc.name} in Studio`)
        expect(preview.text()).toContain(`${scene.doc.layers.length} layers`)
      }
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps the homepage selection small and leads into the full collection', () => {
    const wrapper = mount(ScenesSection, { global })
    try {
      expect(wrapper.findAll('article')).toHaveLength(4)
      expect(wrapper.text()).toContain('Northern lights')
      expect(wrapper.text()).toContain('Deep scan')
      const destinations = wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to'))
      expect(destinations).toContain('/gallery')
      for (const destination of destinations.filter((to) => to !== '/gallery')) {
        expect(galleryGroups.some((group) => destination === `/gallery#${group.id}`)).toBe(true)
      }
    } finally {
      wrapper.unmount()
    }
  })

  it('offers scene-wide comparisons only after a real GPU frame, preserving the original layers', async () => {
    const wrapper = mount(ModifiersSection, { global })
    try {
      const cards = wrapper.findAllComponents(ModifierCard)
      expect(cards.map((card) => card.props('name'))).toEqual(['Signal distortion', 'Pixelate', 'Vignette'])
      for (const [i, card] of cards.entries()) {
        const scene = modifierCards[i]!.scene
        const background = card.findComponent(AuroraBackground)
        const button = card.get('button')
        expect(button.attributes('disabled')).toBeDefined()
        expect(card.text()).toContain('CSS fallback')
        background.vm.$emit('modeChange', 'webgpu')
        await card.vm.$nextTick()
        expect(button.attributes('disabled')).toBeUndefined()
        expect(button.attributes('aria-pressed')).toBe('true')
        await button.trigger('click')
        expect(button.attributes('aria-pressed')).toBe('false')
        expect(card.text()).toContain('Original scene')
        const original = background.props('src') as AuroraDocument
        expect(original.modifiers).toBeUndefined()
        expect(original.layers).toEqual(scene.doc.layers)
        expect(original.palette).toEqual(scene.doc.palette)
        await button.trigger('click')
        expect(background.props('src')).toEqual(scene)
      }
    } finally {
      wrapper.unmount()
    }
  })
})
