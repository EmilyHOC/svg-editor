import MBase from "@/model/MBase";
import MPoint from "@/model/MPoint";
import MControlPoint from "@/model/MControlPoint";
class MLine extends MBase{
    constructor(draw,argv,cad) {
        super(argv)
        this.draw = draw
        this.cad = cad
        this.startPoint = new MPoint(argv.startPoint)
        this.endPoint = new MPoint(argv.endPoint)
        this.group = null
    }

    render(){
        this.group = this.draw.group()
        this.line = this.draw.line(`${this.startPoint.tx},${this.startPoint.ty} ${this.endPoint.tx},${this.endPoint.ty}`).css({
            stroke:  this.color,
            'stroke-dasharray': this.dashArray,
            'stroke-width': 20
        })
        this.line.on('mousedown', (evt) => {
            if (evt.button === 0) {
                evt.stopPropagation()
                evt.preventDefault()
                this.cad.clearItemsSelected()
            }
        })

        this.line.on('mouseup', (evt) => {
            if (evt.button === 0) {
                this.isSelected = true
                this.controlPointList.forEach(item => {
                    item.stop()
                })
                evt.stopPropagation()
                evt.preventDefault()
            }
        })
        this.group.add(this.line)
    }
    plot(){
        window.requestAnimationFrame(() => {
            this.line.plot(`${this.startPoint.tx},${this.startPoint.ty} ${this.endPoint.tx},${this.endPoint.ty}`).css({
                stroke:  this.color,
                'stroke-width': 20
            })
            this.controlPointList.forEach(item => item.plotFunc())
        })
    }
    redraw(lastPosition, currentPosition, flag) {
        this.endPoint.tx += currentPosition.x - lastPosition.x
        this.startPoint.tx += currentPosition.x - lastPosition.x
        this.endPoint.ty += currentPosition.y - lastPosition.y
        this.startPoint.ty += currentPosition.y - lastPosition.y
        if (flag) {
            this.plot()
        }
    }
    //为线添加控制点
    async addControlPointList() {
        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    return svg.circle(radius * 2).cx(this.startPoint.tx).cy(this.startPoint.ty).css({
                        fill: '#456FFF'
                    })
                },
                (pointS) => {
                    pointS.cx(this.startPoint.tx).cy(this.startPoint.ty)
                },
                (lastPosition, currentPosition) => {
                    this.startPoint.tx += currentPosition.x - lastPosition.x
                    this.startPoint.ty += currentPosition.y - lastPosition.y
                    this.plot()
                })
        )

        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    return svg.circle(radius * 2).cx(this.endPoint.tx).cy(this.endPoint.ty).css({
                        fill: '#456FFF'
                    })
                },
                (pointS) => {
                    pointS.cx(this.endPoint.tx).cy(this.endPoint.ty)
                },
                (lastPosition, currentPosition) => {
                    this.endPoint.tx += currentPosition.x - lastPosition.x
                    this.endPoint.ty += currentPosition.y - lastPosition.y
                    this.plot()
                })
        )

        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    return svg.circle(radius * 2).cx(this.group.bbox().cx).cy(this.group.bbox().cy).css({
                        fill: '#e3b94c'
                    })
                },
                (pointS) => {
                    pointS.cx(this.group.bbox().cx).cy(this.group.bbox().cy)
                },
                this.redraw.bind(this))
        )

    }
    getPointList() {
        return [this.startPoint, this.endPoint]
    }

}

export  default MLine
