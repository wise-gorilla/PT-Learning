import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { persistProgress, useProgress } from './stores/progress'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
persistProgress(useProgress())
app.mount('#app')
