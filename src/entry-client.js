import { createSSRApp } from 'vue'
import App from './App.vue'
import { createT } from './i18n/index.js'
import './assets/main.css'

const initial = window.__INITIAL_STATE__ ?? null

const app = createSSRApp(App)
app.provide('initialData', initial)
app.provide('t', createT(initial?.locale ?? 'en'))
app.mount('#app')
