import { createApp } from 'vue';
import App from './App.vue';
import './styles/main.css';

createApp(App).mount('#app');

if (import.meta.env.DEV) {
  void import('./lib/fitCheck').then(({ startFitWarnings }) => startFitWarnings());
}
