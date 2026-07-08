import { createSSRApp } from 'vue'
import App from './App.vue'
import './assets/main.css'

const app = createSSRApp(App)
app.provide('initialData', window.__INITIAL_STATE__ ?? null)
app.mount('#app')
