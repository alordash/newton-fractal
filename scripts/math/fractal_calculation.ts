type PlotScale = {
    x_offset: number,
    y_offset: number,
    x_value_range: number,
    y_value_range: number,
    x_display_range: number,
    y_display_range: number
}

type Complex32 = {
    re: number;
    im: number;
};

function calculateSquareNorm(x: number, y: number): number {
    return x * x + y * y;
}

function getRootId(roots: Complex32[], z: Complex32, iterationsCount: number): number {
    let i = 0;
    for (let iter = 0; iter < iterationsCount; iter++) {
        let sumReal = 0;
        let sumImag = 0;
        i = 0;
        for (const root of roots) {
            let diffReal = z.re - root.re;
            let diffImag = z.im - root.im;
            const squareNorm = calculateSquareNorm(diffReal, diffImag);

            if (squareNorm < 0.001) {
                return i;
            }

            diffReal /= squareNorm;
            diffImag /= -squareNorm;
            sumReal += diffReal;
            sumImag += diffImag;

            i++;
        }
        const squareNorm = calculateSquareNorm(sumReal, sumImag);
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

        let distanceSquared = calculateSquareNorm(diffReal, diffImag);
        if (distanceSquared < minDistance) {
            minDistance = distanceSquared;
            closestRootId = i;
        }
        i++;
    }

    return closestRootId;
}

function transformPointToPlotScale(x: number, y: number, plotScale: PlotScale): number[] {
    return [
        plotScale.x_offset + x * plotScale.x_value_range / plotScale.x_display_range,
        plotScale.y_offset + y * plotScale.y_value_range / plotScale.y_display_range
    ];
}

function transformPointToCanvasScale(x: number, y: number, plotScale: PlotScale): number[] {
    return [
        ((x - plotScale.x_offset) * plotScale.x_display_range / plotScale.x_value_range),
        ((y - plotScale.y_offset) * plotScale.y_display_range / plotScale.y_value_range),
    ];
}

function calculatePartSize(totalSize: number, partsCount: number, offset: number, step: number) {
    return Math.round((totalSize * offset) / (partsCount * step)) * step;
}

function fillPixelsJavascript(buffer: SharedArrayBuffer, plotScale: PlotScale, roots: number[][], iterationsCount: number, colors: number[][], bufferPtr: number, partOffset = 0, partsCount = 1) {
    let {
        x_display_range: width,
        y_display_range: height
    } = plotScale;
    let [w_int, h_int] = [Math.round(width), Math.round(height)];

    let flatColors = new Uint8Array(colors.flat());
    let colorPacks = new Uint32Array(flatColors.buffer);
    let complexRoots: Complex32[] = roots.map(pair => ({ re: pair[0], im: pair[1] }));

    let u32BufferView = new Uint32Array(buffer, bufferPtr);

    let totalSize = w_int * h_int;
    let thisBorder = calculatePartSize(totalSize, partsCount, partOffset, 1);
    let nextBorder = calculatePartSize(totalSize, partsCount, partOffset + 1, 1);

    for (let i = thisBorder; i < nextBorder; i++) {
        let [xp, yp] = transformPointToPlotScale(i % w_int, i / w_int, plotScale);
        u32BufferView[i] = colorPacks[
            getRootId(complexRoots, { re: xp, im: yp }, iterationsCount)
        ];
    }
}

export {
    transformPointToCanvasScale,
    transformPointToPlotScale,
    fillPixelsJavascript
};