import MLine from "@/model/MLine";
import vBus from "@/plugins/vBus";
import {CheckIsInRect }from '@/utils/common'
import MPolyLine from "@/model/MPolyLine";
import MText from "@/model/MText";
import MCircle from "@/model/MCircle";
import MArc from "@/model/MArc";
import MGroup from "@/model/MGroup";
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
        
        // 渲染配置
        this.renderConfig = {
            batchSize: 5,           // 每批渲染的对象数量
            timeSlice: 25,          // 时间片大小（毫秒）
            maxBatchTime: 10,       // 单批最大渲染时间（毫秒）
            enablePerformanceMonitoring: true,  // 是否启用性能监控
            enableErrorHandling: true,          // 是否启用错误处理
            renderPriority: {       // 渲染优先级
                line: 1,
                polyline: 2,
                text: 3,
                circle: 4,
                arc: 5,
                group: 6
            }
        }
        
        // 性能统计
        this.renderStats = {}
        
        for (let i = 0; i < argv.objects.length; i++) {
            // 过滤掉不展示的
            if (argv.objects[i].show !== false) {
                switch (argv.objects[i].desc) {
                    case 'line': {
                        const line = new MLine(this.draw, argv.objects[i], this);
                        this.lines.push(line);
                        this.objectsMap[argv.objects[i].id] = line;
                        break;
                    }
                    case 'polyline': {
                        const polyline = new MPolyLine(this.draw, argv.objects[i], this);
                        this.polylines.push(polyline);
                        this.objectsMap[argv.objects[i].id] = polyline;
                        break;
                    }
                    case 'text': {
                        const text = new MText(this.draw, argv.objects[i], this);
                        this.texts.push(text);
                        this.objectsMap[argv.objects[i].id] = text;
                        break;
                    }
                    case 'circle': {
                        const circle = new MCircle(this.draw, argv.objects[i], this);
                        this.circles.push(circle);
                        this.objectsMap[argv.objects[i].id] = circle;
                        break;
                    }
                    case 'arc': {
                        const arc = new MArc(this.draw, argv.objects[i], this);
                        this.arcs.push(arc);
                        this.objectsMap[argv.objects[i].id] = arc;
                        break;
                    }
                    case 'group': {
                        const group = new MGroup(this.draw, argv.objects[i], this);
                        this.groups.push(group);
                        this.objectsMap[argv.objects[i].id] = group;
                        break;
                    }
                    // case 'ole': this.oles.push(new MOles(this.draw, argv.objects[i], this))
                    //     break;


                }
            }
        }


    }
    async render() {
        console.log('开始渲染', new Date().getTime())
        
        // 定义渲染任务配置
        const renderTasks = [
            { name: 'line', generator: this.renderLines.bind(this), priority: this.renderConfig.renderPriority.line },
            { name: 'polyline', generator: this.renderPolylines.bind(this), priority: this.renderConfig.renderPriority.polyline },
            { name: 'text', generator: this.renderTexts.bind(this), priority: this.renderConfig.renderPriority.text },
            { name: 'circle', generator: this.renderCircles.bind(this), priority: this.renderConfig.renderPriority.circle },
            { name: 'arc', generator: this.renderArcs.bind(this), priority: this.renderConfig.renderPriority.arc },
            { name: 'group', generator: this.renderGroups.bind(this), priority: this.renderConfig.renderPriority.group }
        ];
        
        // 按优先级排序
        renderTasks.sort((a, b) => a.priority - b.priority);
        
        // 执行渲染任务
        for (const task of renderTasks) {
            try {
                vBus.$emit('setWaitMessage', `正在渲染 ${task.name}`)
                await this.timeSlice(task.generator)()
                console.log(`${task.name} 渲染完成`)
            } catch (error) {
                console.error(`${task.name} 渲染失败:`, error)
                vBus.$emit('setWaitMessage', `${task.name} 渲染失败`)
            }
        }
        
        console.log('渲染完成', new Date().getTime())
        vBus.$emit('setWaitMessage', '渲染完成')
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
    // 通用的对象渲染生成器
    * renderObjects(objects, batchSize = null) {
        batchSize = batchSize || this.renderConfig.batchSize;
        if (!Array.isArray(objects) || objects.length === 0) {
            return;
        }
        
        const startTime = performance.now();
        let renderedCount = 0;
        let errorCount = 0;
        const batchStartTime = performance.now();
        
        try {
            for (let i = 0; i < objects.length; i += batchSize) {
                const batch = objects.slice(i, i + batchSize);
                const batchRenderStart = performance.now();
                
                // 批量渲染对象
                batch.forEach(item => {
                    if (item && typeof item.render === 'function') {
                        try {
                            item.render();
                            renderedCount++;
                        } catch (error) {
                            console.warn('渲染对象失败:', item, error);
                            errorCount++;
                        }
                    }
                });
                
                // 性能监控
                const batchTime = performance.now() - batchRenderStart;
                if (this.renderConfig.enablePerformanceMonitoring && batchTime > this.renderConfig.maxBatchTime) {
                    console.warn(`批次渲染时间过长: ${batchTime.toFixed(2)}ms`);
                }
                
                // 检查是否需要暂停（基于时间或批次大小）
                const currentTime = performance.now();
                const totalTime = currentTime - batchStartTime;
                
                if (totalTime > this.renderConfig.timeSlice || i % (batchSize * 3) === 0) {
                    yield;
                }
            }
            
            const totalTime = performance.now() - startTime;
            
            if (this.renderConfig.enablePerformanceMonitoring) {
                console.log(`渲染完成 ${renderedCount} 个对象，耗时 ${totalTime.toFixed(2)}ms，错误 ${errorCount} 个`);
                
                // 性能统计
                this.updateRenderStats({
                    totalObjects: objects.length,
                    renderedObjects: renderedCount,
                    errorObjects: errorCount,
                    renderTime: totalTime,
                    averageTimePerObject: totalTime / renderedCount
                });
            }
            
        } catch (error) {
            console.error('批量渲染过程中发生错误:', error);
        }
    }
    
    // 更新渲染统计信息
    updateRenderStats(stats) {
        if (!this.renderStats) {
            this.renderStats = {};
        }
        
        this.renderStats = {
            ...this.renderStats,
            ...stats,
            lastUpdate: new Date().toISOString()
        };
        
        // 可以在这里发送统计信息到监控系统
        // this.sendStatsToAnalytics(stats);
    }
    
    // 获取渲染统计信息
    getRenderStats() {
        return this.renderStats;
    }
    
    // 获取渲染配置
    getRenderConfig() {
        return this.renderConfig;
    }
    
    // 更新渲染配置
    updateRenderConfig(newConfig) {
        this.renderConfig = {
            ...this.renderConfig,
            ...newConfig
        };
    }
    
    // 各类型对象的渲染函数
    * renderLines() {
        yield* this.renderObjects(this.lines);
    }
    
    * renderPolylines() {
        yield* this.renderObjects(this.polylines);
    }
    
    * renderTexts() {
        yield* this.renderObjects(this.texts);
    }
    
    * renderCircles() {
        yield* this.renderObjects(this.circles);
    }
    
    * renderArcs() {
        yield* this.renderObjects(this.arcs);
    }
    
    * renderGroups() {
        yield* this.renderObjects(this.groups);
    }
    clearItemsSelected(){
        for (const key in this.lines) {
            this.lines[key].isSelected = false
        }
        for (const key in this.polylines) {
            this.polylines[key].isSelected = false
        }
        for (const key in this.texts) {
            this.texts[key].isSelected = false
        }
        for (const key in this.circles) {
            this.circles[key].isSelected = false
        }
        for (const key in this.arcs) {
            this.arcs[key].isSelected = false
        }
        for (const key in this.groups) {
            this.groups[key].isSelected = false
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
