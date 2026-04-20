import { waitUntil } from 'async-wait-until';
import Vue from 'vue';
import App from './App.vue';

$(async () => {
  await waitGlobalInitialized('Mvu');
  await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));
  Vue.createApp(App).use(createPinia()).mount('#app');
});
