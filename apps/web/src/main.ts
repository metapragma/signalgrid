import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize auth store and validate token before mounting
const bootstrap = async () => {
  const { useAuthStore } = await import('./stores/auth');
  const auth = useAuthStore(pinia);
  await auth.init();
  app.mount('#app');
};

bootstrap();
