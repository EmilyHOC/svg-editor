import MLine from "@/model/MLine";
import vBus from "@/plugins/vBus";
import {CheckIsInRect }from '@/utils/common'
class MCad{
    constructor(draw, argv) {
        this.draw = draw
        this.minX = argv.minX || 0
        this.minY = argv.minY || 0
        this.maxX = argv.maxX || 0
        this.maxY = argv.maxY || 0
        this.lines = []
        this.polylines = []
        this.arcs = []
        this.circles = []
        this.texts = []
        this.oles = []
        this.groups = []
        this.objectsMap = {}
        for (let i = 0; i < argv.objects.length; i++) {
            // 过滤掉不展示的
            if (argv.objects[i].show !== false) {
                switch (argv.objects[i].desc) {
                    case 'line': this.lines.push(new MLine(this.draw, argv.objects[i], this))
                        break;
                    // case 'polyline': this.polylines.push(new MPolyLine(this.draw, argv.objects[i], this))
                    //     break;
                    // case 'text': this.texts.push(new MText(this.draw, argv.objects[i], this))
                    //     break;
                    // case 'circle': this.circles.push(new MCircle(this.draw, argv.objects[i], this))
                    //     break;
                    // case 'ole': this.oles.push(new MOles(this.draw, argv.objects[i], this))
                    //     break;
                    // case 'arc': this.arcs.push(new MArc(this.draw, argv.objects[i], this))
                    //     break;
                    // case 'group': this.groups.push(new MGroup(this.draw, {
                    //     idList: argv.objects[i].groupItems,
                    //     cad: this
                    // }, argv.objects[i].id, argv.objects[i].data, argv.objects[i].bbox))
                    //     break;
                }
            }
        }

    }
    async render() {
        console.log('开始渲染', new Date().getTime())
        vBus.$emit('setWaitMessage', '正在渲染 line')
        await this.timeSlice(this.renderLines)()
    }
    timeSlice(fnc, time = 25, cb = setTimeout) {
        return (...args) => {
            const fnc_ = fnc.apply(this, ...args)
            let data
            const go = async (resolve, reject) => {
                try {
                    const start = performance.now()

                    do {
                        data = fnc_.next(await data?.value)
                    } while (!data.done && performance.now() - start < time)

                    if (data.done) {
                        return resolve(data.value)
                    }

                    cb(() => go(resolve, reject))
                } catch (e) {
                    reject(e)
                }
            }
            return new Promise(go)
        }
    }
    * renderLines() {
        for (let i = 0; i < this.lines.length; i++) {
            const item = this.lines[i]
            yield item.render()
        }
    }
    clearItemsSelected(){
        for (const key in this.lines) {
            this.lines[key].isSelected = false
        }
    }
    selectItemsInRect(startPoint, endPoint) {
        const selectedItems = []
        for (const key in this.objectsMap) {
            if (CheckIsInRect(startPoint, endPoint, this.objectsMap[key].getPointList())) {
                this.objectsMap[key].isSelected = true
                selectedItems.push(this.objectsMap[key])
            }
        }
    }
}

export default MCad
