import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

console.log('Starting application initialization...')

// Create app instance
const app = createApp(App)
console.log('Vue app instance created')

// Create and use Pinia store
const pinia = createPinia()
app.use(pinia)
console.log('Pinia store initialized')

// Use router
app.use(router)
console.log('Router initialized')

// Mount app
app.mount('#app')
console.log('App mounted to #app')

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('Registering service worker...')
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration)
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error)
      })
  })
}
