import MBase from "@/model/MBase";
import MPoint from "@/model/MPoint";
import MControlPoint from "@/model/MControlPoint";

class MPolyLine extends MBase{
    constructor(draw,argv,cad) {
        super(argv)
        this.draw = draw
        this.cad = cad
        this.points = argv.points.map(item => new MPoint(item))
        this.group = null
        
        // 为了向后兼容，也初始化 startPoint 和 endPoint
        if (this.points && this.points.length > 0) {
            this.startPoint = this.points[0];
            this.endPoint = this.points[this.points.length - 1];
        } else if (argv.startPoint && argv.endPoint) {
            this.startPoint = new MPoint(argv.startPoint);
            this.endPoint = new MPoint(argv.endPoint);
        }
    }

    render(){
        this.group = this.draw.group()
        
        // 根据 this.points 数组构建 polyline 路径
        if (this.points && this.points.length > 0) {
            // 创建 polyline 路径
            const pathData = this.points.map((point, index) => {
                if (index === 0) {
                    return `M ${point.tx} ${point.ty}`;
                } else {
                    return `L ${point.tx} ${point.ty}`;
                }
            }).join(' ');
            
            this.polyline = this.draw.path(pathData).css({
                stroke: this.color,
                'stroke-dasharray': this.dashArray,
                'stroke-width': this.stokeWidth,
                fill: 'none'
            });
        } else {
            // 如果没有 points 数组，则使用原来的直线方式
            this.polyline = this.draw.line(`${this.startPoint.tx},${this.startPoint.ty} ${this.endPoint.tx},${this.endPoint.ty}`).css({
                stroke: this.color,
                'stroke-dasharray': this.dashArray,
                'stroke-width': this.stokeWidth
            });
        }
        
        this.polyline.on('mousedown', (evt) => {
            if (evt.button === 0) {
                evt.stopPropagation()
                evt.preventDefault()
                this.cad.clearItemsSelected()
            }
        })

        this.polyline.on('mouseup', (evt) => {
            if (evt.button === 0) {
                this.isSelected = true
                this.controlPointList.forEach(item => {
                    item.stop()
                })
                evt.stopPropagation()
                evt.preventDefault()
            }
        })
        this.group.add(this.polyline)
    }

    plot(){
        window.requestAnimationFrame(() => {
            if (this.points && this.points.length > 0) {
                // 构建路径数据
                const pathData = this.points.map((point, index) => {
                    if (index === 0) {
                        return `M ${point.tx} ${point.ty}`;
                    } else {
                        return `L ${point.tx} ${point.ty}`;
                    }
                }).join(' ');
                
                this.polyline.plot(pathData).css({
                    stroke: this.color,
                    'stroke-width': this.stokeWidth
                });
            }
            this.controlPointList.forEach(item => item.plotFunc())
        })
    }

    redraw(lastPosition, currentPosition, flag) {
        // 移动所有点
        this.points.forEach(point => {
            point.tx += currentPosition.x - lastPosition.x
            point.ty += currentPosition.y - lastPosition.y
        });
        
        if (flag) {
            this.plot()
        }
    }

    //为polyline添加控制点
    async addControlPointList() {
        // 为每个点添加控制点
        this.points.forEach((point) => {
            this.controlPointList.push(
                new MControlPoint(this.draw, this.group,
                    (svg, radius) => {
                        return svg.circle(radius * 2).cx(point.tx).cy(point.ty).css({
                            fill: '#456FFF'
                        })
                    },
                    (pointS) => {
                        pointS.cx(point.tx).cy(point.ty)
                    },
                    (lastPosition, currentPosition) => {
                        point.tx += currentPosition.x - lastPosition.x
                        point.ty += currentPosition.y - lastPosition.y
                        this.plot()
                    })
            )
        });

        // 添加整体移动控制点（中心点）
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
        return this.points
    }
}

export default MPolyLine