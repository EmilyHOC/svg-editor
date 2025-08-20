import MBase from "@/model/MBase";
import MPoint from "@/model/MPoint";
import MControlPoint from "@/model/MControlPoint";

class MCircle extends MBase{
    constructor(draw,argv,cad) {
        super(argv)
        this.draw = draw
        this.cad = cad
        this.center = new MPoint(argv.center)
        this.majorRadius = argv.majorRadius || 100
        this.minorRadius = argv.minorRadius || 100
        this.show = argv.show !== false // 默认为 true
        this.group = null
    }

    render(){
        this.group = this.draw.group()
        
        // 检查是否应该显示
        if (this.show === false) {
            this.group.hide()
        }
        
        // 创建圆或椭圆元素
        let majorRadius = this.majorRadius / 10 // 缩放半径
        let minorRadius = this.minorRadius / 10 // 缩放半径
        
        // 限制半径范围
        if (majorRadius < 2) majorRadius = 2
        if (majorRadius > 200) majorRadius = 200
        if (minorRadius < 2) minorRadius = 2
        if (minorRadius > 200) minorRadius = 200
        
        // 判断是否为椭圆
        if (Math.abs(majorRadius - minorRadius) > 0.1) {
            // 椭圆
            this.circle = this.draw.ellipse(majorRadius * 2, minorRadius * 2).css({
                stroke: this.color,
                'stroke-dasharray': this.dashArray,
                'stroke-width': this.stokeWidth,
                fill: this.fillColorIndex > 0 ? this.fillColor : 'none',
                'pointer-events': 'all' // 确保椭圆可以接收鼠标事件
            })
        } else {
            // 圆
            this.circle = this.draw.circle(majorRadius * 2).css({
                stroke: this.color,
                'stroke-dasharray': this.dashArray,
                'stroke-width': this.stokeWidth,
                fill: this.fillColorIndex > 0 ? this.fillColor : 'none',
                'pointer-events': 'all' // 确保圆可以接收鼠标事件
            })
        }
        
        // 设置圆心位置
        this.circle.cx(this.center.tx).cy(this.center.ty)
        
        this.circle.on('mousedown', (evt) => {
            if (evt.button === 0) {
                evt.stopPropagation()
                evt.preventDefault()
                this.cad.clearItemsSelected()
            }
        })

        this.circle.on('mouseup', (evt) => {
            if (evt.button === 0) {
                this.isSelected = true
                this.controlPointList.forEach(item => {
                    item.stop()
                })
                evt.stopPropagation()
                evt.preventDefault()
            }
        })
        
        this.group.add(this.circle)
    }

    plot(){
        window.requestAnimationFrame(() => {
            // 更新圆心位置
            this.circle.cx(this.center.tx).cy(this.center.ty)
            
            // 更新半径
            let majorRadius = this.majorRadius / 10 // 缩放半径
            let minorRadius = this.minorRadius / 10 // 缩放半径
            
            // 限制半径范围
            if (majorRadius < 2) majorRadius = 2
            if (majorRadius > 200) majorRadius = 200
            if (minorRadius < 2) minorRadius = 2
            if (minorRadius > 200) minorRadius = 200
            
            // 判断是否为椭圆
            if (Math.abs(majorRadius - minorRadius) > 0.1) {
                // 椭圆
                this.circle.size(majorRadius * 2, minorRadius * 2)
            } else {
                // 圆
                this.circle.radius(majorRadius)
            }
            
            // 更新样式
            this.circle.css({
                stroke: this.color,
                'stroke-width': this.stokeWidth,
                fill: this.fillColorIndex > 0 ? this.fillColor : 'none'
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

    //为圆添加控制点
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

        // 添加半径控制点（右边缘）
        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    const scaledRadius = this.majorRadius / 10 // 缩放半径
                    return svg.circle(radius * 2).cx(this.center.tx + scaledRadius).cy(this.center.ty).css({
                        fill: '#FF456F'
                    })
                },
                (pointS) => {
                    const scaledRadius = this.majorRadius / 10 // 缩放半径
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
        // 返回圆心和四个方向的点，用于选择功能
        const scaledRadius = this.majorRadius / 10 // 缩放半径
        return [
            this.center,
            new MPoint({ x: this.center.x + scaledRadius, y: this.center.y }),
            new MPoint({ x: this.center.x - scaledRadius, y: this.center.y }),
            new MPoint({ x: this.center.x, y: this.center.y + scaledRadius }),
            new MPoint({ x: this.center.x, y: this.center.y - scaledRadius })
        ]
    }
}

export default MCircle
