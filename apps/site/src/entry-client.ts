import { loadGenerators } from '@goatsoft/aurora'
import { createSite } from './app'

// Generator specs (labels, params, CSS) render into the prerendered HTML; load them before hydrating.
// gruff starts this after first paint; `gruff:hydrated` replays a button pressed before then.
const { app, router } = createSite(location.pathname)
void Promise.all([router.isReady(), loadGenerators()]).then(() => {
  app.mount('#app')
  dispatchEvent(new Event('gruff:hydrated'))
})
