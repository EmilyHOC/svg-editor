import MColor from "@/model/MColor";
const store = require('@/store/index').default
class MBase {
    constructor(argv) {
        this._colorIndex = argv.colorIndex || 256
        this._color = new MColor(this._colorIndex)
        this._fillColorIndex = argv.fillColorIndex || 256
        this._fillColor = new MColor(this._fillColorIndex, true)
        this._lineWeight = argv.lineWeight
        this._stokeWidth = (!this._lineWeight || this._lineWeight <= 0) ? 20 : this._lineWeight
        this._isSelected = false

        this._linetypeScale = argv.linetypeScale
        this._numDashes = argv.numDashes
        this._dashLength = argv.dashLength || []

        this.controlPointList = []
        this.isLoadControlPointList = false
        this._data = argv.data || ''

    }
    get colorIndex() {
        return this._colorIndex
    }
    get fillColorIndex() {
        return this._fillColorIndex
    }

    get lineWeight() {
        return this._lineWeight
    }
    set lineWeight(lineWeight) {
        this._lineWeight = lineWeight
    }
    get linetypeScale() {
        return this._linetypeScale
    }

    set linetypeScale(val) {
        this._linetypeScale = val
    }

    get numDashes() {
        return this._numDashes
    }

    get dashLength() {
        return this._dashLength
    }

    get dashArray() {
        if (this._numDashes > 0) {
            return [20, 20]
        }
        return []
    }

    get isSelected() {
        return this._isSelected
    }

    set isSelected(state) {
        this._isSelected = state
        if (this._isSelected) {
            if (!this.isLoadControlPointList) {
                this.addControlPointList()
                this.isLoadControlPointList = true
            }
            this.controlPointList.forEach(item => item.show())
        } else {
            this.controlPointList.forEach(item => item.hide())
        }
    }

    get color() {
        return this._color.color
    }

    get fillColor() {
        return this._fillColor.color
    }

    set fillColor(color) {
        this._fillColor.color = color
    }

    get stokeWidth() {
        if(store.state.svgData.lineWeight !==10){
            return Number(this._stokeWidth) / 90
        }
        if ((Number(this._stokeWidth) / 10) < 10) {
            return 10
        }

        return Number(this._stokeWidth) / 10
    }

    set stokeWidth(stokeWidth) {
        this._stokeWidth = stokeWidth
    }

    get data() {
        return this._data
    }

    set data(data) {
        this._data = data
    }
}

export default  MBase
