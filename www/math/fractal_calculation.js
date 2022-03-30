function calculateDistance(x, y) {
    let ratio = x / y;
    return Math.abs(y) * Math.sqrt(1 + ratio * ratio);
}
function getRootId(roots, z, iterationsCount) {
    let i = 0;
    for (let iter = 0; iter < iterationsCount; iter++) {
        let sumReal = 0;
        let sumImag = 0;
        i = 0;
        for (const root of roots) {
            let diffReal = z.re - root.re;
            let diffImag = z.im - root.im;
            const squareNorm = diffReal * diffReal + diffImag * diffImag;
            if (squareNorm < 0.001) {
                return i;
            }
            diffReal /= squareNorm;
            diffImag /= -squareNorm;
            sumReal += diffReal;
            sumImag += diffImag;
            i++;
        }
        const squareNorm = sumReal * sumReal + sumImag * sumImag;
        sumReal /= squareNorm;
        sumImag /= -squareNorm;
        z.re -= sumReal;
        z.im -= sumImag;
    }
    let minDistance = Infinity;
    let closestRootId = 0;
    i = 0;
    for (const root of roots) {
        let diffReal = z.re - root.re;
        let diffImag = z.im - root.im;
        let distance = calculateDistance(diffReal, diffImag);
        if (distance < minDistance) {
            minDistance = distance;
            closestRootId = i;
        }
        i++;
    }
    return closestRootId;
}
function transformPointToPlotScale(x, y, plotScale) {
    return [
        plotScale.x_offset + x * plotScale.x_value_range / plotScale.x_display_range,
        plotScale.y_offset + y * plotScale.y_value_range / plotScale.y_display_range
    ];
}
function transformPointToCanvasScale(x, y, plotScale) {
    return [
        ((x - plotScale.x_offset) * plotScale.x_display_range / plotScale.x_value_range),
        ((y - plotScale.y_offset) * plotScale.y_display_range / plotScale.y_value_range),
    ];
}
function calculatePartSize(totalSize, partsCount, offset, step) {
    return Math.round((totalSize * offset) / (partsCount * step)) * step;
}
function fillPixelsJavascript(buffer, plotScale, roots, iterationsCount, colors, bufferPtr, partOffset = 0, partsCount = 1) {
    let { x_display_range: width, y_display_range: height } = plotScale;
    let [w_int, h_int] = [Math.round(width), Math.round(height)];
    let flatColors = new Uint8Array(colors.flat());
    let colorPacks = new Uint32Array(flatColors.buffer);
    let complexRoots = roots.map(pair => ({ re: pair[0], im: pair[1] }));
    let u32BufferView = new Uint32Array(buffer, bufferPtr);
    let totalSize = w_int * h_int;
    let thisBorder = calculatePartSize(totalSize, partsCount, partOffset, 1);
    let nextBorder = calculatePartSize(totalSize, partsCount, partOffset + 1, 1);
    for (let i = thisBorder; i < nextBorder; i++) {
        let [xp, yp] = transformPointToPlotScale(i % w_int, i / w_int, plotScale);
        u32BufferView[i] = colorPacks[getRootId(complexRoots, { re: xp, im: yp }, iterationsCount)];
    }
}
//# sourceMappingURL=fractal_calculation.js.map