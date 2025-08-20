import MBase from "@/model/MBase";
import MPoint from "@/model/MPoint";
import MControlPoint from "@/model/MControlPoint";

class MGroup extends MBase{
    constructor(draw,argv,cad) {
        super(argv)
        this.draw = draw
        this.cad = cad
        this.centerPoint = argv.centerPoint ? new MPoint({ x: argv.centerPoint[0], y: argv.centerPoint[1] }) : null
        this.data = argv.data || ""
        this.groupItems = argv.groupItems || []
        this.bbox = argv.bbox || null
        this.show = argv.show !== false // 默认为 true
        this.group = null
        this.groupObjects = [] // 存储组内的对象引用
    }

    render(){
        this.group = this.draw.group()
        
        // 检查是否应该显示
        if (this.show === false) {
            this.group.hide()
        }
        
        // 渲染组内的所有对象
        this.renderGroupItems()
        
        // 为组添加鼠标事件处理
        this.group.on('mousedown', (evt) => {
            if (evt.button === 0) {
                evt.stopPropagation()
                evt.preventDefault()
                this.cad.clearItemsSelected()
            }
        })

        this.group.on('mouseup', (evt) => {
            if (evt.button === 0) {
                this.isSelected = true
                this.controlPointList.forEach(item => {
                    item.stop()
                })
                evt.stopPropagation()
                evt.preventDefault()
            }
        })
    }

    renderGroupItems() {
        // 清空之前的对象引用
        this.groupObjects = []
        
        // 遍历组内的所有对象ID
        for (const itemId of this.groupItems) {
            const item = this.cad.objectsMap[itemId]
            if (item) {
                // 将对象添加到组中
                this.group.add(item.group)
                this.groupObjects.push(item)
            }
        }
    }

    plot(){
        window.requestAnimationFrame(() => {
            // 更新组内所有对象的显示状态
            this.groupObjects.forEach(item => {
                if (item.plot) {
                    item.plot()
                }
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
        // 移动组内所有对象
        const deltaX = currentPosition.x - lastPosition.x
        const deltaY = currentPosition.y - lastPosition.y
        
        this.groupObjects.forEach(item => {
            if (item.redraw) {
                item.redraw(lastPosition, currentPosition, false)
            }
        })
        
        // 更新中心点
        if (this.centerPoint) {
            this.centerPoint.tx += deltaX
            this.centerPoint.ty += deltaY
        }
        
        if (flag) {
            this.plot()
        }
    }

    //为组添加控制点
    async addControlPointList() {
        // 添加中心点控制点（如果存在）
        if (this.centerPoint) {
            this.controlPointList.push(
                new MControlPoint(this.draw, this.group,
                    (svg, radius) => {
                        return svg.circle(radius * 2).cx(this.centerPoint.tx).cy(this.centerPoint.ty).css({
                            fill: '#456FFF'
                        })
                    },
                    (pointS) => {
                        pointS.cx(this.centerPoint.tx).cy(this.centerPoint.ty)
                    },
                    (lastPosition, currentPosition) => {
                        this.centerPoint.tx += currentPosition.x - lastPosition.x
                        this.centerPoint.ty += currentPosition.y - lastPosition.y
                        this.plot()
                    })
            )
        }

        // 添加整体移动控制点（组的边界框中心）
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

        // 添加边界框控制点（四个角）
        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    const bbox = this.group.bbox()
                    return svg.circle(radius * 2).cx(bbox.x).cy(bbox.y).css({
                        fill: '#FF8C00'
                    })
                },
                (pointS) => {
                    const bbox = this.group.bbox()
                    pointS.cx(bbox.x).cy(bbox.y)
                },
                (lastPosition, currentPosition) => {
                    // 缩放组（从左上角）
                    const bbox = this.group.bbox()
                    const scaleX = (currentPosition.x - bbox.cx) / (lastPosition.x - bbox.cx)
                    const scaleY = (currentPosition.y - bbox.cy) / (lastPosition.y - bbox.cy)
                    this.scaleGroup(scaleX, scaleY, bbox.cx, bbox.cy)
                })
        )

        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    const bbox = this.group.bbox()
                    return svg.circle(radius * 2).cx(bbox.x2).cy(bbox.y).css({
                        fill: '#FF8C00'
                    })
                },
                (pointS) => {
                    const bbox = this.group.bbox()
                    pointS.cx(bbox.x2).cy(bbox.y)
                },
                (lastPosition, currentPosition) => {
                    // 缩放组（从右上角）
                    const bbox = this.group.bbox()
                    const scaleX = (currentPosition.x - bbox.cx) / (lastPosition.x - bbox.cx)
                    const scaleY = (currentPosition.y - bbox.cy) / (lastPosition.y - bbox.cy)
                    this.scaleGroup(scaleX, scaleY, bbox.cx, bbox.cy)
                })
        )

        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    const bbox = this.group.bbox()
                    return svg.circle(radius * 2).cx(bbox.x2).cy(bbox.y2).css({
                        fill: '#FF8C00'
                    })
                },
                (pointS) => {
                    const bbox = this.group.bbox()
                    pointS.cx(bbox.x2).cy(bbox.y2)
                },
                (lastPosition, currentPosition) => {
                    // 缩放组（从右下角）
                    const bbox = this.group.bbox()
                    const scaleX = (currentPosition.x - bbox.cx) / (lastPosition.x - bbox.cx)
                    const scaleY = (currentPosition.y - bbox.cy) / (lastPosition.y - bbox.cy)
                    this.scaleGroup(scaleX, scaleY, bbox.cx, bbox.cy)
                })
        )

        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    const bbox = this.group.bbox()
                    return svg.circle(radius * 2).cx(bbox.x).cy(bbox.y2).css({
                        fill: '#FF8C00'
                    })
                },
                (pointS) => {
                    const bbox = this.group.bbox()
                    pointS.cx(bbox.x).cy(bbox.y2)
                },
                (lastPosition, currentPosition) => {
                    // 缩放组（从左下角）
                    const bbox = this.group.bbox()
                    const scaleX = (currentPosition.x - bbox.cx) / (lastPosition.x - bbox.cx)
                    const scaleY = (currentPosition.y - bbox.cy) / (lastPosition.y - bbox.cy)
                    this.scaleGroup(scaleX, scaleY, bbox.cx, bbox.cy)
                })
        )
    }

    scaleGroup(scaleX, scaleY, centerX, centerY) {
        // 对组内所有对象进行缩放
        this.groupObjects.forEach(item => {
            if (item.scale) {
                item.scale(scaleX, scaleY, centerX, centerY)
            }
        })
        this.plot()
    }

    getPointList() {
        // 返回组的边界框点和中心点，用于选择功能
        const bbox = this.group.bbox()
        const points = []
        
        if (this.centerPoint) {
            points.push(this.centerPoint)
        }
        
        points.push(
            new MPoint({ x: bbox.x, y: bbox.y }),
            new MPoint({ x: bbox.x2, y: bbox.y }),
            new MPoint({ x: bbox.x2, y: bbox.y2 }),
            new MPoint({ x: bbox.x, y: bbox.y2 }),
            new MPoint({ x: bbox.cx, y: bbox.cy })
        )
        
        return points
    }

    // 获取组内所有对象的点列表
    getAllGroupPoints() {
        const allPoints = []
        this.groupObjects.forEach(item => {
            if (item.getPointList) {
                allPoints.push(...item.getPointList())
            }
        })
        return allPoints
    }

    // 解散组
    ungroup() {
        // 将组内对象从组中移除，但不删除它们
        this.groupObjects.forEach(item => {
            // 将对象重新添加到主画布
            this.cad.draw.add(item.group)
        })
        
        // 隐藏组
        this.group.hide()
        this.show = false
    }
}

export default MGroup
