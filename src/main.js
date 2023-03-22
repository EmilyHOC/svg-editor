import Vue from 'vue'
import App from './App.vue'
import plugin from './plugins'

import store from './store'
Vue.config.productionTip = false

Vue.use(plugin)
new Vue({
  render: h => h(App),
  store
}).$mount('#app')
