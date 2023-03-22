import Vuex from 'vuex'
import Vue from 'vue'
Vue.use(Vuex)
const store = new Vuex.Store({
    state: {
        svgData: {}
    },
    mutations: {
        COMMIT_JSON(state,data){
            state.svgData = data
        }
    }
})

export default store
