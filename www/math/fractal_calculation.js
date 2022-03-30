class Complex32 {
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }
    clone() {
        return new Complex32(this.re, this.im);
    }
    add(other) {
        this.re += other.re;
        this.im += other.im;
    }
    subtract(other) {
        this.re -= other.re;
        this.im -= other.im;
    }
    invert() {
        const square_sum = this.normSqr();
        this.re /= square_sum;
        this.im /= -square_sum;
    }
    normSqr() {
        return this.re * this.re + this.im * this.im;
    }
    distance() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }
}
function calculateDistance(x, y) {
    let ratio = x / y;
    return Math.abs(y) * Math.sqrt(1 + ratio * ratio);
}
function getRootId(roots, z, iterationsCount) {
    let i = 0;
    for (let iter = 0; iter < iterationsCount; iter++) {
        let sum = new Complex32(0, 0);
        i = 0;
        for (const root of roots) {
            let diff = z.clone();
            diff.subtract(root);
            let squareNorm = diff.re * diff.re + diff.im * diff.im;
            if (squareNorm < 0.001) {
                return i;
            }
            diff.re /= squareNorm;
            diff.im /= -squareNorm;
            sum.add(diff);
            i++;
        }
        sum.invert();
        z.subtract(sum);
    }
    let minDistance = Infinity;
    let closestRootId = 0;
    i = 0;
    for (const root of roots) {
        let d = z.clone();
        d.subtract(root);
        let distance = calculateDistance(d.re, d.im);
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
    let complexRoots = roots.map((pair) => new Complex32(pair[0], pair[1]));
    let u32BufferView = new Uint32Array(buffer, bufferPtr);
    let totalSize = w_int * h_int;
    let thisBorder = calculatePartSize(totalSize, partsCount, partOffset, 1);
    let nextBorder = calculatePartSize(totalSize, partsCount, partOffset + 1, 1);
    for (let i = thisBorder; i < nextBorder; i++) {
        let [xp, yp] = transformPointToPlotScale(i % w_int, i / w_int, plotScale);
        u32BufferView[i] = colorPacks[getRootId(complexRoots, new Complex32(xp, yp), iterationsCount)];
    }
}
//# sourceMappingURL=fractal_calculation.js.map