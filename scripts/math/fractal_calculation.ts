type PlotScale = {
    x_offset: number,
    y_offset: number,
    x_value_range: number,
    y_value_range: number,
    x_display_range: number,
    y_display_range: number
}

class Complex32 {
    re: number;
    im: number;
    constructor(re: number, im: number) {
        this.re = re;
        this.im = im;
    }

    clone() {
        return new Complex32(this.re, this.im);
    }

    add(other: Complex32) {
        this.re += other.re;
        this.im += other.im;
    }

    subtract(other: Complex32) {
        this.re -= other.re;
        this.im -= other.im;
    }

    invert() {
        const square_sum = this.normSqr();
        this.re /= square_sum;
        this.im /= -square_sum;
    }

    normSqr(): number {
        return this.re * this.re + this.im * this.im;
    }

    distance(): number {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }
}

function calculateDistance(x: number, y: number): number {
    let ratio = x / y;
    return x * Math.sqrt(1 + ratio * ratio);
    // return Math.sqrt(x * x + y * y);
}

function getRootId(roots: Complex32[], z: Complex32, iterationsCount: number): number {
    let i = 0;

    for (let iter = 0; iter < iterationsCount; iter++) {
        let sum = new Complex32(0, 0);
        i = 0;
        for (const root of roots) {
            let diff = z.clone();
            diff.subtract(root);
            if (Math.abs(diff.re) < 0.001 && Math.abs(diff.im) < 0.001) {
                return i;
            }
            diff.invert();
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
        // let distance = calculateDistance(d.re, d.im);
        let distance = Math.sqrt(d.re * d.re + d.im * d.im);
        if (distance < minDistance) {
            minDistance = distance;
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
    let complexRoots: Complex32[] = roots.map((pair) => new Complex32(pair[0], pair[1]));

    let u32BufferView = new Uint32Array(buffer, bufferPtr);

    let totalSize = w_int * h_int;
    let thisBorder = calculatePartSize(totalSize, partsCount, partOffset, 1);
    let nextBorder = calculatePartSize(totalSize, partsCount, partOffset + 1, 1);

    for (let i = thisBorder; i < nextBorder; i++) {
        let [xp, yp] = transformPointToPlotScale(i % w_int, i / w_int, plotScale);
        u32BufferView[i] = colorPacks[
            getRootId(complexRoots, new Complex32(xp, yp), iterationsCount)
        ];
    }
}