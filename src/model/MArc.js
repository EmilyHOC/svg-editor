import MBase from "@/model/MBase";
import MPoint from "@/model/MPoint";
import MControlPoint from "@/model/MControlPoint";

class MArc extends MBase{
    constructor(draw,argv,cad) {
        super(argv)
        this.draw = draw
        this.cad = cad
        this.center = new MPoint(argv.center)
        this.majorRadius = argv.majorRadius || 100
        this.minorRadius = argv.minorRadius || 100
        this.startAngle = argv.startAngle || 0
        this.endAngle = argv.endAngle || Math.PI * 2
        this.startPoint = argv.startPoint ? new MPoint(argv.startPoint) : null
        this.endPoint = argv.endPoint ? new MPoint(argv.endPoint) : null
        this.show = argv.show !== false // 默认为 true
        this.group = null
    }

    render(){
        this.group = this.draw.group()
        
        // 检查是否应该显示
        if (this.show === false) {
            this.group.hide()
        }
        
        // 创建圆弧路径
        const pathData = this.createArcPath()
        
        this.arc = this.draw.path(pathData).css({
            stroke: this.color,
            'stroke-dasharray': this.dashArray,
            'stroke-width': this.stokeWidth,
            fill: 'none',
            'pointer-events': 'all' // 确保圆弧可以接收鼠标事件
        })
        
        this.arc.on('mousedown', (evt) => {
            if (evt.button === 0) {
                evt.stopPropagation()
                evt.preventDefault()
                this.cad.clearItemsSelected()
            }
        })

        this.arc.on('mouseup', (evt) => {
            if (evt.button === 0) {
                this.isSelected = true
                this.controlPointList.forEach(item => {
                    item.stop()
                })
                evt.stopPropagation()
                evt.preventDefault()
            }
        })
        
        this.group.add(this.arc)
    }

    createArcPath() {
        // 缩放半径
        let majorRadius = this.majorRadius / 10
        let minorRadius = this.minorRadius / 10
        
        // 限制半径范围
        if (majorRadius < 2) majorRadius = 2
        if (majorRadius > 200) majorRadius = 200
        if (minorRadius < 2) minorRadius = 2
        if (minorRadius > 200) minorRadius = 200
        
        // 标准化角度到 0-2π 范围
        let startAngle = this.startAngle % (2 * Math.PI)
        let endAngle = this.endAngle % (2 * Math.PI)
        
        if (startAngle < 0) startAngle += 2 * Math.PI
        if (endAngle < 0) endAngle += 2 * Math.PI
        
        // 计算起点和终点坐标
        const startX = this.center.tx + majorRadius * Math.cos(startAngle)
        const startY = this.center.ty + minorRadius * Math.sin(startAngle)
        const endX = this.center.tx + majorRadius * Math.cos(endAngle)
        const endY = this.center.ty + minorRadius * Math.sin(endAngle)
        
        // 计算大弧标志
        let largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0
        
        // 计算扫描标志（顺时针为1，逆时针为0）
        let sweepFlag = endAngle > startAngle ? 1 : 0
        
        // 处理跨越 0 度的情况
        if (Math.abs(endAngle - startAngle) > Math.PI) {
            largeArcFlag = 1
        }
        
        // 构建SVG路径
        const pathData = `M ${startX} ${startY} A ${majorRadius} ${minorRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`
        
        return pathData
    }

    plot(){
        window.requestAnimationFrame(() => {
            // 更新圆弧路径
            const pathData = this.createArcPath()
            this.arc.plot(pathData)
            
            // 更新样式
            this.arc.css({
                stroke: this.color,
                'stroke-width': this.stokeWidth
            })
            
            // 更新可见性
            if (this.show === false) {
                this.group.hide()
            } else {
                this.group.show()
            }
            
            this.controlPointList.forEach(item => item.plotFunc())
        })
    }

    redraw(lastPosition, currentPosition, flag) {
        // 移动圆心位置
        this.center.tx += currentPosition.x - lastPosition.x
        this.center.ty += currentPosition.y - lastPosition.y
        
        if (flag) {
            this.plot()
        }
    }

    //为圆弧添加控制点
    async addControlPointList() {
        // 添加圆心控制点
        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    return svg.circle(radius * 2).cx(this.center.tx).cy(this.center.ty).css({
                        fill: '#456FFF'
                    })
                },
                (pointS) => {
                    pointS.cx(this.center.tx).cy(this.center.ty)
                },
                (lastPosition, currentPosition) => {
                    this.center.tx += currentPosition.x - lastPosition.x
                    this.center.ty += currentPosition.y - lastPosition.y
                    this.plot()
                })
        )

        // 添加起点控制点
        let startAngle = this.startAngle % (2 * Math.PI)
        if (startAngle < 0) startAngle += 2 * Math.PI
        const startX = this.center.tx + (this.majorRadius / 10) * Math.cos(startAngle)
        const startY = this.center.ty + (this.minorRadius / 10) * Math.sin(startAngle)
        
        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    return svg.circle(radius * 2).cx(startX).cy(startY).css({
                        fill: '#FF456F'
                    })
                },
                (pointS) => {
                    let startAngle = this.startAngle % (2 * Math.PI)
                    if (startAngle < 0) startAngle += 2 * Math.PI
                    const startX = this.center.tx + (this.majorRadius / 10) * Math.cos(startAngle)
                    const startY = this.center.ty + (this.minorRadius / 10) * Math.sin(startAngle)
                    pointS.cx(startX).cy(startY)
                },
                (lastPosition, currentPosition) => {
                    // 计算新的起始角度
                    let newStartAngle = Math.atan2(
                        currentPosition.y - this.center.ty,
                        currentPosition.x - this.center.tx
                    )
                    // 标准化角度
                    newStartAngle = newStartAngle % (2 * Math.PI)
                    if (newStartAngle < 0) newStartAngle += 2 * Math.PI
                    this.startAngle = newStartAngle
                    this.plot()
                })
        )

        // 添加终点控制点
        let endAngle = this.endAngle % (2 * Math.PI)
        if (endAngle < 0) endAngle += 2 * Math.PI
        const endX = this.center.tx + (this.majorRadius / 10) * Math.cos(endAngle)
        const endY = this.center.ty + (this.minorRadius / 10) * Math.sin(endAngle)
        
        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    return svg.circle(radius * 2).cx(endX).cy(endY).css({
                        fill: '#FF456F'
                    })
                },
                (pointS) => {
                    let endAngle = this.endAngle % (2 * Math.PI)
                    if (endAngle < 0) endAngle += 2 * Math.PI
                    const endX = this.center.tx + (this.majorRadius / 10) * Math.cos(endAngle)
                    const endY = this.center.ty + (this.minorRadius / 10) * Math.sin(endAngle)
                    pointS.cx(endX).cy(endY)
                },
                (lastPosition, currentPosition) => {
                    // 计算新的结束角度
                    let newEndAngle = Math.atan2(
                        currentPosition.y - this.center.ty,
                        currentPosition.x - this.center.tx
                    )
                    // 标准化角度
                    newEndAngle = newEndAngle % (2 * Math.PI)
                    if (newEndAngle < 0) newEndAngle += 2 * Math.PI
                    this.endAngle = newEndAngle
                    this.plot()
                })
        )

        // 添加半径控制点（右边缘）
        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    const scaledRadius = this.majorRadius / 10
                    return svg.circle(radius * 2).cx(this.center.tx + scaledRadius).cy(this.center.ty).css({
                        fill: '#FF8C00'
                    })
                },
                (pointS) => {
                    const scaledRadius = this.majorRadius / 10
                    pointS.cx(this.center.tx + scaledRadius).cy(this.center.ty)
                },
                (lastPosition, currentPosition) => {
                    const newRadius = Math.sqrt(
                        Math.pow(currentPosition.x - this.center.tx, 2) + 
                        Math.pow(currentPosition.y - this.center.ty, 2)
                    ) * 10 // 反缩放半径
                    if (newRadius > 50) { // 最小半径限制
                        this.majorRadius = newRadius
                        this.minorRadius = newRadius
                        this.plot()
                    }
                })
        )

        // 添加整体移动控制点（中心点）
        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    const bbox = this.group.bbox()
                    return svg.circle(radius * 2).cx(bbox.cx).cy(bbox.cy).css({
                        fill: '#e3b94c'
                    })
                },
                (pointS) => {
                    const bbox = this.group.bbox()
                    pointS.cx(bbox.cx).cy(bbox.cy)
                },
                this.redraw.bind(this))
        )
    }

    getPointList() {
        // 返回圆心、起点、终点和四个方向的点，用于选择功能
        const scaledRadius = this.majorRadius / 10
        let startAngle = this.startAngle % (2 * Math.PI)
        let endAngle = this.endAngle % (2 * Math.PI)
        if (startAngle < 0) startAngle += 2 * Math.PI
        if (endAngle < 0) endAngle += 2 * Math.PI
        
        const startX = this.center.tx + scaledRadius * Math.cos(startAngle)
        const startY = this.center.ty + scaledRadius * Math.sin(startAngle)
        const endX = this.center.tx + scaledRadius * Math.cos(endAngle)
        const endY = this.center.ty + scaledRadius * Math.sin(endAngle)
        
        return [
            this.center,
            new MPoint({ x: startX, y: startY }),
            new MPoint({ x: endX, y: endY }),
            new MPoint({ x: this.center.x + scaledRadius, y: this.center.y }),
            new MPoint({ x: this.center.x - scaledRadius, y: this.center.y }),
            new MPoint({ x: this.center.x, y: this.center.y + scaledRadius }),
            new MPoint({ x: this.center.x, y: this.center.y - scaledRadius })
        ]
    }
}

export default MArc
