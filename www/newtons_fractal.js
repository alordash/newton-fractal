class Complex32 {
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }
    add(other) {
        return new Complex32(this.re + other.re, this.im + other.im);
    }
    subtract(other) {
        return new Complex32(this.re - other.re, this.im - other.im);
    }
    normSqr() {
        return this.re * this.re + this.im * this.im;
    }
    invert() {
        const square_sum = this.normSqr();
        return new Complex32(this.re / square_sum, -this.im / square_sum);
    }
    distance() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }
}
function newtonMethodApprox(roots, z) {
    let sum = new Complex32(0, 0);
    for (let i in roots) {
        const root = roots[i];
        const diff = z.subtract(root);
        if (diff.re == 0 && diff.im == 0) {
            return { idx: +i, z };
        }
        sum = sum.add(diff.invert());
    }
    return { idx: -1, z: z.subtract(sum.invert()) };
}
function transformPointToPlotScale(x, y, plotScale) {
    return [
        ((x - plotScale.x_offset) * plotScale.x_display_range / plotScale.x_value_range),
        ((y - plotScale.y_offset) * plotScale.y_display_range / plotScale.y_value_range),
    ];
}
function fillPixelsJavascript(plotScale, roots, iterationsCount, colors) {
    let { x_display_range: width, y_display_range: height } = plotScale;
    let [w_int, h_int] = [Math.round(width), Math.round(height)];
    let flatColors = new Uint8Array(colors.flat());
    let colorPacks = new Uint32Array(flatColors.buffer);
    let complexRoots = roots.map((pair) => new Complex32(pair[0], pair[1]));
    let uint32Data = new Uint32Array(w_int * h_int);
    let index = 0;
    for (let y = 0; y < h_int; y++) {
        for (let x = 0; x < w_int; x++) {
            let minDistance = Number.MAX_SAFE_INTEGER;
            let closestRootId = 0;
            let [xp, yp] = transformPointToPlotScale(x, y, plotScale);
            let z = new Complex32(xp, yp);
            let colorId = -1;
            for (let i = 0; i < iterationsCount; i++) {
                let { idx, z: zNew } = newtonMethodApprox(complexRoots, z);
                if (idx != -1) {
                    colorId = idx;
                    break;
                }
                z = zNew;
            }
            if (colorId != -1) {
                uint32Data[index++] = colorPacks[colorId];
                continue;
            }
            for (let i in complexRoots) {
                const root = complexRoots[i];
                let d = z.subtract(root).distance();
                if (d < minDistance) {
                    minDistance = d;
                    closestRootId = +i;
                }
            }
            uint32Data[index++] = colorPacks[closestRootId];
        }
    }
    let uint8Data = new Uint8ClampedArray(uint32Data.buffer);
    let imageData = new ImageData(uint8Data, w_int, h_int);
    return imageData;
}
export { fillPixelsJavascript };
//# sourceMappingURL=newtons_fractal.js.map