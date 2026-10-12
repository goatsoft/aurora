import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'
import favicon from '~/assets/brand/favicon-auto.svg?url'
import './main.css'

// The adaptive favicon, imported from the brand assets (index.html can't use the ~ alias).
document.head.append(Object.assign(document.createElement('link'), { rel: 'icon', type: 'image/svg+xml', href: favicon }))

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })
createApp(App).use(router).mount('#app')
