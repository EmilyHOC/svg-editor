const CheckIsInRect = (startPoint, endPoint, pointList) => {
    for (let i = 0; i < pointList.length; i++) {
        if (pointList[i].tx < startPoint.x || pointList[i].ty < startPoint.y || pointList[i].tx > endPoint.x || pointList[i].ty > endPoint.y) {
            return false
        }
    }
    return true
}

const GetMaxMinXY = (pointList) => {
    let mCadMaxX = Number.MIN_VALUE
    let mCadMaxY = Number.MIN_VALUE
    let mCadMinX = Number.MAX_VALUE
    let mCadMinY = Number.MAX_VALUE

    pointList.forEach(point => {
        if (point.tx > mCadMaxX) {
            mCadMaxX = point.tx
        }
        if (point.ty > mCadMaxY) {
            mCadMaxY = point.ty
        }
        if (point.tx < mCadMinX) {
            mCadMinX = point.tx
        }
        if (point.ty < mCadMinY) {
            mCadMinY = point.ty
        }
    })
    return { x: mCadMaxX, y: mCadMaxY, x2: mCadMinX, y2: mCadMinY }
}

module.exports = {
    CheckIsInRect,
    GetMaxMinXY
}
