// Plain JavaScript, so every bundler can build it without a TypeScript loader.
import { mountAurora } from '@goatsoft/aurora'
import { auroraBadge } from '@goatsoft/aurora/badge'
import '@goatsoft/aurora/element'
import hero from './hero.aurora'

mountAurora(document.querySelector('#hero'), hero)
document.body.dataset.badge = auroraBadge().src
