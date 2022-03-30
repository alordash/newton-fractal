type PlotScale = {
    x_offset: number,
    y_offset: number,
    x_value_range: number,
    y_value_range: number,
    x_display_range: number,
    y_display_range: number
}

function complexAbs(real: number, imag: number): number {
    // This is more numerically stable than `sqrt(x^2 + y^2)`.
    let ratio = real / imag;
    return real * Math.sqrt(1 + ratio * ratio);
}

function getRootId(roots: Float32Array, iterationsCount: number, xp: number, yp: number): number {
    /*
    This is the following pseudocode loop where `Im` is the imaginary unit and `real(x)` and
    `imag(x)` get the real and imaginary parts of `x` respectively:

    ```js
    let z = xp + yp*Im;

    // Perform a Newton's method approximation using `iterationsCount` rounds to find the
    // nearest root. If it gets close enough to a root, return it.
    for (let i = 0; i < iterationsCount; i++) {
        let sum = 0 + 0*Im;
        for (let i = 0; i < roots.length; i += 2) {
            let rootReal = roots[i + 0];
            let rootImag = roots[i + 1];
            let root = rootReal + rootImag*Im;
            let diff = z - root;
            if (real(diff) < 0.001 && imag(diff) < 0.001) {
                return i;
            }
            sum += 1 / diff;
        }
        z -= 1 / sum;
    }

    // Failing a close-enough match, find and return the root with the nearest distance.
    let minDistance = Infinity;
    let closestRootId = 0;

    for (let i = 0; i < roots.length; i += 2) {
        let rootReal = roots[i + 0];
        let rootImag = roots[i + 1];
        let dst = abs(z - root);
        if (dst < minDistance) {
            minDistance = dst;
            closestRootId = i;
        }
    }
    return closestRootId;
    ```

    First, I split it apart into using real and imaginary scalars directly:

    ```js
    let realZ = xp;
    let imagZ = yp;

    // Perform a Newton's method approximation using `iterationsCount` rounds to find the
    // nearest root. If it gets close enough to a root, return it.
    for (let i = 0; i < iterationsCount; i++) {
        let sumReal = 0;
        let sumImag = 0;
        for (let i = 0; i < roots.length; i += 2) {
            let rootReal = roots[i + 0];
            let rootImag = roots[i + 1];
            let diffReal = realZ - rootReal;
            let diffImag = imagZ - rootImag;
            if (diffReal < 0.001 && diffImag < 0.001) {
                return i;
            }
            // 1/(x + yi) = x/(x^2 + y^2) - (y/(x^2 + y^2))i
            // (a + bi) + 1/(x + yi) = (a + x/(x^2 + y^2)) + (b - y/(x^2 + y^2))i
            let squareNorm = diffReal * diffReal + diffImag * diffImag;
            sumReal += diffReal / squareNorm;
            sumImag += diffImag / -squareNorm;
        }
        // 1/(x + yi) = x/(x^2 + y^2) - (y/(x^2 + y^2))i
        // (a + bi) - 1/(x + yi) = (a - x/(x^2 + y^2)) + (b + y/(x^2 + y^2))i
        let squareNorm = sumReal * sumReal + sumImag * sumImag;
        realZ += sumReal / -squareNorm;
        imagZ += sumImag / squareNorm;
    }

    // Failing a close-enough match, find and return the root with the nearest distance.
    let minDistance = Infinity;
    let closestRootId = 0;

    for (let i = 0; i < roots.length; i += 2) {
        let rootReal = roots[i + 0];
        let rootImag = roots[i + 1];
        let dst = complexAbs(realZ - rootReal, imagZ - rootImag);
        if (dst < minDistance) {
            minDistance = dst;
            closestRootId = i;
        }
    }
    return closestRootId;
    ```

    Then, in the inner loop, I take advantage of a useful mathematical identity to avoid some
    calls to `Math.abs` (cheap) as well as an extra floating point comparison (expensive).
    `a < b and c < d` and `a + c < b + d` are equivalent provided all four variables are
    non-negative. If I square both sides of each comparison, `a < b` and `c < d`, that condition
    would be guaranteed, and that leaves the following expression: `a^2 + c^2 < b^2 * d^2`. When
    I substitute `diffReal` for `a`, `diffImag` for `c`, and `0.001` for `b` and `d`, I get the
    following expression:

    ```js
    diffReal * diffReal + diffImag * diffImag < 0.001 * 0.001 + 0.001 * 0.001
    ```

    The left side just so happens to be the `squareNorm` computed from earlier, and the right
    side happens to be all constant (it evaluates to `0.000002`). Leveraging this, I can then
    revise that code to what's now below.
    */

    let realZ = xp;
    let imagZ = yp;

    // Perform a Newton's method approximation using `iterationsCount` rounds to find the
    // nearest root. If it gets close enough to a root, return it.
    for (let i = 0; i < iterationsCount; i++) {
        let sumReal = 0;
        let sumImag = 0;
        for (let i = 0; i < roots.length; i += 2) {
            let rootReal = roots[i + 0];
            let rootImag = roots[i + 1];
            let diffReal = realZ - rootReal;
            let diffImag = imagZ - rootImag;
            // 1/(x + yi) = x/(x^2 + y^2) - (y/(x^2 + y^2))i
            // (a + bi) + 1/(x + yi) = (a + x/(x^2 + y^2)) + (b - y/(x^2 + y^2))i
            let squareNorm = diffReal * diffReal + diffImag * diffImag;
            if (squareNorm < 0.000002) {
                return i;
            }
            sumReal += diffReal / squareNorm;
            sumImag += diffImag / -squareNorm;
        }
        // 1/(x + yi) = x/(x^2 + y^2) - (y/(x^2 + y^2))i
        // (a + bi) - 1/(x + yi) = (a - x/(x^2 + y^2)) + (b + y/(x^2 + y^2))i
        let squareNorm = sumReal * sumReal + sumImag * sumImag;
        realZ += sumReal / -squareNorm;
        imagZ += sumImag / squareNorm;
    }

    // Failing a close-enough match, find and return the root with the nearest distance.
    let minDistance = Infinity;
    let closestRootId = 0;

    for (let i = 0; i < roots.length; i += 2) {
        let rootReal = roots[i + 0];
        let rootImag = roots[i + 1];
        let dst = complexAbs(realZ - rootReal, imagZ - rootImag);
        if (dst < minDistance) {
            minDistance = dst;
            closestRootId = i;
        }
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
    let flattenedRoots = Float32Array.from(roots.flat());
    let u32BufferView = new Uint32Array(buffer, bufferPtr);

    let totalSize = w_int * h_int;
    let thisBorder = calculatePartSize(totalSize, partsCount, partOffset, 1);
    let nextBorder = calculatePartSize(totalSize, partsCount, partOffset + 1, 1);

    for (let i = thisBorder; i < nextBorder; i++) {
        let [xp, yp] = transformPointToPlotScale(i % w_int, i / w_int, plotScale);
        u32BufferView[i] = colorPacks[getRootId(flattenedRoots, iterationsCount, xp, yp)];
    }
}
