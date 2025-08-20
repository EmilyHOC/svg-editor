
class MRubber {
    constructor(svg, cad) {
        this.svg = svg
        this.cad = cad
        this.rubberStarted = false
        this.rubberRect = null
        this.rubberBeginPoint = null
        this.rubberHandle = null

        this.svg.on('mousedown', (evt) => {
            if (evt.button === 0) {
                this.start(evt)
            }
        })

        this.svg.on('mousemove', (evt) => {
            if (evt.button === 0 && this.isStart()) {
                this.update(evt)
            }
        })

        this.svg.on('mouseup', (evt) => {
            if (this.isStart() && evt.button === 0) {
                this.cad.clearItemsSelected()
                const points = this.end(evt)
                if (points.length === 2) {
                    this.cad.selectItemsInRect(points[0], points[1])
                }
            }
        })
    }

    isStart() {
        return this.rubberStarted
    }

    start(evt) {
        this.rubberBeginPoint = this.svg.point(evt.pageX, evt.pageY)
        this.rubberStarted = true
    }

    update(evt) {
        window.requestAnimationFrame(() => {
            if (!this.isStart()) {
                return
            }
            if (this.rubberRect) {
                this.rubberRect.remove()
                this.rubberRect = null
            }
            const currentPoint = this.svg.point(evt.pageX, evt.pageY)

            this.rubberRect = this.svg.path(`M ${this.rubberBeginPoint.x},${this.rubberBeginPoint.y} L ${this.rubberBeginPoint.x},${currentPoint.y} L ${currentPoint.x},${currentPoint.y} L ${currentPoint.x},${this.rubberBeginPoint.y} z`).css({
                fill: '#193760A0',
                'stroke-width': 1,
                'stroke': '#E3E7EC'
            })
        })
    }

    end(evt) {
        this.rubberStarted = false

        if (this.rubberHandle) {
            clearTimeout(this.rubberHandle)
            this.rubberHandle = null
        }
        const endPoint = this.svg.point(evt.pageX, evt.pageY)

        if (this.rubberRect) {
            this.rubberRect.remove()
            this.rubberRect = null
        }
        const x1 = this.rubberBeginPoint.x
        const x2 = endPoint.x
        const y1 = this.rubberBeginPoint.y
        const y2 = endPoint.y

        const minX = Math.min(x1, x2)
        const maxX = Math.max(x1, x2)
        const minY = Math.min(y1, y2)
        const maxY = Math.max(y1, y2)

        return [{
            x: minX,
            y: minY
        }, {
            x: maxX,
            y: maxY
        }]
    }
}

export default MRubber
