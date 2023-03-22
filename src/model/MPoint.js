const store = require('@/store/index').default

class MPoint {
    constructor(argv = {
        x: 0,
        y: 0
    }) {
        this.x = Number(argv.x)
        this.y = Number(argv.y)
    }

    equals(other) {
        return (Math.abs(other.x - this.x) <= 0.0001 && Math.abs(other.y - this.y) <= 0.0001)
    }

    get tx() {
        const {
            minX
        } = store.state.svgData

        return Number(this.x) - Number(minX)
    }

    set tx(value) {
        const {
            minX
        } = store.state.svgData
        this.x = Number(value) + Number(minX)
    }

    get ty() {
        const {
            maxY,
            minY
        } = store.state.svgData
        const cadHeight = maxY - minY
        return cadHeight - (Number(this.y) - Number(minY))
    }

    set ty(value) {
        const {
            minY,
            maxY
        } = store.state.svgData
        const cadHeight = maxY - minY
        this.y = cadHeight + Number(minY) - Number(value)
    }
}

export  default MPoint
