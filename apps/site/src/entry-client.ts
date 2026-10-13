import { loadGenerators } from '@goatsoft/aurora'
import { createSite } from './app'

// Generator specs (labels, params, CSS) render into the prerendered HTML; load them before hydrating.
const { app, router } = createSite(location.pathname)
void Promise.all([router.isReady(), loadGenerators()]).then(() => app.mount('#app'))
