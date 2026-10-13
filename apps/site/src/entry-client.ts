import { loadGenerators } from '@goatsoft/aurora'
import { createSite } from './app'

// Built pages get the favicon from the prerendered <head>; the dev server serves index.html without one.
if (import.meta.env.DEV) {
  void import('~/assets/brand/favicon-auto.svg?url').then(({ default: href }) => {
    document.head.append(Object.assign(document.createElement('link'), { rel: 'icon', type: 'image/svg+xml', href }))
  })
}

// Generator specs (labels, params, CSS) render into the prerendered HTML; load them before hydrating.
// gruff starts this after first paint; `gruff:hydrated` replays a button pressed before then.
const { app, router } = createSite(location.pathname)
void Promise.all([router.isReady(), loadGenerators()]).then(() => {
  app.mount('#app')
  dispatchEvent(new Event('gruff:hydrated'))
})
