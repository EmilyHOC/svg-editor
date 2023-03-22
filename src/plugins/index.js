import vBus from './vBus'


const index = {}

index.install = function (Vue) {
    Vue.prototype.$vBus = vBus
}
export default index
