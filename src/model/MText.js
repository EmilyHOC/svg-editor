import MBase from "@/model/MBase";
import MPoint from "@/model/MPoint";
import MControlPoint from "@/model/MControlPoint";

class MText extends MBase{
    constructor(draw,argv,cad) {
        super(argv)
        this.draw = draw
        this.cad = cad
        this.position = new MPoint(argv.position)
        this.value = this.processTextValue(argv.value || '')
        this.fontSize = argv.fontSize || 350
        this.rotation = argv.rotation || 0
        this.show = argv.show !== false // 默认为 true
        this.group = null
    }

    processTextValue(value) {
        // 处理特殊字符
        // %%U 表示下划线开始
        // %%O 表示上划线开始
        // %%D 表示度数符号
        // %%P 表示正负号
        // %%C 表示直径符号
        // %%% 表示百分号
        
        let processedValue = value
        
        // 移除 %%U 前缀（下划线）
        processedValue = processedValue.replace(/^%%U\s*/, '')
        
        // 移除 %%O 前缀（上划线）
        processedValue = processedValue.replace(/^%%O\s*/, '')
        
        // 替换 %%D 为度数符号
        processedValue = processedValue.replace(/%%D/g, '°')
        
        // 替换 %%P 为正负号
        processedValue = processedValue.replace(/%%P/g, '±')
        
        // 替换 %%C 为直径符号
        processedValue = processedValue.replace(/%%C/g, 'Ø')
        
        // 替换 %%% 为百分号
        processedValue = processedValue.replace(/%%%/g, '%')
        
        // 处理换行符
        processedValue = processedValue.replace(/\\n/g, '\n')
        
        return processedValue
    }

    render(){
        this.group = this.draw.group()
        
        // 检查是否应该显示
        if (this.show === false) {
            this.group.hide()
        }
        
        // 创建文本元素
        let fontSize = this.fontSize / 10 // 缩放字体大小
        
        // 限制字体大小范围
        if (fontSize < 8) fontSize = 14
        if (fontSize > 100) fontSize = 100
        
        if (this.value.includes('\n')) {
            // 如果有换行符，创建多行文本
            const lines = this.value.split('\n')
            this.text = this.draw.text('').css({
                fill: this.fillColorIndex > 0 ? this.fillColor : this.color,
                'font-size': fontSize,
                'font-family': 'Arial, sans-serif',
                'font-weight': this.lineWeight > 0 ? 'bold' : 'normal',
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                'pointer-events': 'all' // 确保文本可以接收鼠标事件
            })
            
            lines.forEach((line, index) => {
                this.text.tspan(line).dy(index === 0 ? 0 : fontSize)
            })
        } else {
            // 单行文本
            this.text = this.draw.text(this.value).css({
                fill: this.fillColorIndex > 0 ? this.fillColor : this.color,
                'font-size': fontSize,
                'font-family': 'Arial, sans-serif',
                'font-weight': this.lineWeight > 0 ? 'bold' : 'normal',
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                'pointer-events': 'all' // 确保文本可以接收鼠标事件
            })
        }
        
        // 设置位置
        this.text.cx(this.position.tx).cy(this.position.ty)
        
        // 设置旋转
        if (this.rotation !== 0) {
            this.text.transform({ 
                rotation: this.rotation * 180 / Math.PI,
                origin: 'center'
            })
        }
        
        this.text.on('mousedown', (evt) => {
            if (evt.button === 0) {
                evt.stopPropagation()
                evt.preventDefault()
                this.cad.clearItemsSelected()
            }
        })

        this.text.on('mouseup', (evt) => {
            if (evt.button === 0) {
                this.isSelected = true
                this.controlPointList.forEach(item => {
                    item.stop()
                })
                evt.stopPropagation()
                evt.preventDefault()
            }
        })
        
        this.group.add(this.text)
    }

    plot(){
        window.requestAnimationFrame(() => {
            // 更新文本内容
            let fontSize = this.fontSize / 10 // 缩放字体大小
            
            // 限制字体大小范围
            if (fontSize < 8) fontSize = 8
            if (fontSize > 100) fontSize = 100
            
            if (this.value.includes('\n')) {
                // 多行文本
                const lines = this.value.split('\n')
                this.text.clear()
                lines.forEach((line, index) => {
                    this.text.tspan(line).dy(index === 0 ? 0 : fontSize)
                })
            } else {
                // 单行文本
                this.text.text(this.value)
            }
            
            // 更新文本位置
            this.text.cx(this.position.tx).cy(this.position.ty)
            
            // 更新旋转
            if (this.rotation !== 0) {
                this.text.transform({ 
                    rotation: this.rotation * 180 / Math.PI,
                    origin: 'center'
                })
            } else {
                this.text.transform({ rotation: 0 })
            }
            
            // 更新样式
            this.text.css({
                fill: this.fillColorIndex > 0 ? this.fillColor : this.color,
                'font-size': fontSize,
                'font-weight': this.lineWeight > 0 ? 'bold' : 'normal'
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
        // 移动文本位置
        this.position.tx += currentPosition.x - lastPosition.x
        this.position.ty += currentPosition.y - lastPosition.y
        
        if (flag) {
            this.plot()
        }
    }

    //为文本添加控制点
    async addControlPointList() {
        // 添加位置控制点
        this.controlPointList.push(
            new MControlPoint(this.draw, this.group,
                (svg, radius) => {
                    return svg.circle(radius * 2).cx(this.position.tx).cy(this.position.ty).css({
                        fill: '#456FFF'
                    })
                },
                (pointS) => {
                    pointS.cx(this.position.tx).cy(this.position.ty)
                },
                (lastPosition, currentPosition) => {
                    this.position.tx += currentPosition.x - lastPosition.x
                    this.position.ty += currentPosition.y - lastPosition.y
                    this.plot()
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
        return [this.position]
    }
}

export default MText
