import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'
import { createHead } from './head'
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
    scrollBehavior: (to, _from, saved) => saved ?? (to.hash ? { el: to.hash, top: 96, behavior: 'smooth' } : { top: 0 }),
  })
  app.use(router)
  const head = createHead(app, path)
  return { app, router, head }
}
