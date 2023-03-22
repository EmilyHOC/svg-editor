const uuid = require('uuid')
class MControlPoint {
    /**
     * 控制点
     * @param draw SVG 对象
     * @param group 包含的组
     * @param createFunc 创建 SVG 对象的函数
     * @param plotFunc 控制点更新函数
     * @param mouseoverCb 点位移动时的回调函数
     */
    constructor(draw, group, createFunc, plotFunc, mouseoverCb) {
        this.id = uuid.v4()
        this.draw = draw
        this.radius = 5

        if (createFunc instanceof Function) {
            this.pointS = createFunc(this.draw, this.radius / this.draw.zoom())
            if (group) {
                group.add(this.pointS)
            }
        } else {
            throw new Error('MControlPoint\'s createFunc must not be null')
        }

        if (mouseoverCb instanceof Function) {
            this.mouseoverCb = mouseoverCb
        } else {
            throw new Error('MControlPoint\'s mouseoverCb must not be null')
        }

        if (plotFunc instanceof Function) {
            this.plotFunc = () => {
                return plotFunc(this.pointS)
            }
        } else {
            throw new Error('MControlPoint\'s plotFunc must not be null')
        }

        this.controlPointMouseDown = false
        this.controlPointMouseDownBeginPoint = null

        this.hide()
        this.init()
    }

    init() {
        this.draw.on(`zoom.${this.id}`, ({detail}) => {
            this.pointS.radius(this.radius / detail.level)
        })

        this.pointS.on(`mousedown.${this.id}`, (evt) => {
            if (evt.button === 0) {
                this.controlPointMouseDown = true
                this.controlPointMouseDownBeginPoint = this.draw.point(evt.pageX, evt.pageY)
                evt.stopPropagation()
                evt.preventDefault()
            }

            this.draw.on(`mousemove.${this.id}`, (evt_) => {
                if (this.controlPointMouseDown) {
                    const tmpPoint = this.draw.point(evt_.pageX, evt_.pageY)
                    this.mouseoverCb(this.controlPointMouseDownBeginPoint, tmpPoint, true)
                    this.controlPointMouseDownBeginPoint = tmpPoint
                    evt_.stopPropagation()
                    evt_.preventDefault()
                }
            })

            this.pointS.on(`mouseup.${this.id}`, (evt_) => {
                if (this.controlPointMouseDown) {
                    this.stop()
                    evt_.stopPropagation()
                    evt_.preventDefault()
                }
            })

            this.draw.on(`mouseup.${this.id}`, (evt_) => {
                if (this.controlPointMouseDown) {
                    this.stop()
                    evt_.stopPropagation()
                    evt_.preventDefault()
                }
            })
        })
    }

    stop() {
        this.controlPointMouseDown = false
        this.draw.off(`mousemove.${this.id}`)
        this.draw.off(`mouseup.${this.id}`)
    }

    hide() {
        this.pointS.hide()
        this.stop()
    }

    show() {
        this.pointS.show()
    }

    remove() {
        this.pointS.remove()
    }
}

export default MControlPoint
