import { gruffDocs } from '@goatsoft/gruff/vue'
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'
import { createHead } from './head'
import { docs } from './lib/docs'
import { reveal } from './lib/reveal'
import '@fontsource-variable/inter'
import './main.css'

/** One app for both the prerender (memory history) and the browser (hydrating the same HTML). */
export function createSite(path: string) {
  const app = createSSRApp(App)
  app.directive('reveal', import.meta.env.SSR ? {} : reveal)
  const router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes,
    scrollBehavior: (to, _from, saved) => {
      const still = !import.meta.env.SSR && (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset['paused'] === 'true')
      return saved ?? (to.hash ? { el: to.hash, top: 96, behavior: still ? 'instant' : 'smooth' } : { top: 0 })
    },
  })
  app.use(router)
  app.use(gruffDocs(docs))
  const head = createHead(app, path)
  return { app, router, head }
}
