import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'

/** Renders the app to HTML. The Aurora CSS fallback is part of it, so the first paint has the backgrounds. */
export function render(): Promise<string> {
  return renderToString(createSSRApp(App))
}
