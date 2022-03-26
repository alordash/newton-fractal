type PlotScale = {
    x_offset: number,
    y_offset: number,
    x_value_range: number,
    y_value_range: number,
    x_display_range: number,
    y_display_range: number
}

function createPartialSums(iterationsCount: number): number[] {
    // Pre-allocate this so it's not being allocated in the hot loop.
    const sums = [];

    for (let j = 0; j < iterationsCount; j++) {
        sums.push(0 /* real */, 0 /* imag */);
    }

    return sums;
}

function getRootId(partialSums: number[], roots: number[][], xp: number, yp: number): number {
    /*
    This is the following pseudocode loop where `Im` is the imaginary unit and `real(x)` and
    `imag(x)` get the real and imaginary parts of `x` respectively:

    ```js
    let z = xp + yp*Im;

    // Perform a Newton's method approximation using `iterationsCount` rounds to find the
    // nearest root. If it gets close enough to a root, return it.
    for (let i = 0; i < iterationsCount; i++) {
        let sum = 0 + 0*Im;
        for (let i = 0; i < roots.length; i++) {
            let [rootReal, rootImag] = roots[i];
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

    for (let i = 0; i < roots.length; i++) {
        let [rootReal, rootImag] = roots[i];
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
        for (let i = 0; i < roots.length; i++) {
            let [rootReal, rootImag] = roots[i];
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

    for (let i = 0; i < roots.length; i++) {
        let [rootReal, rootImag] = roots[i];
        // JS has a `Math.hypot(x, y)` returning a more accurate form of `sqrt(x^2 + y^2)`
        let dst = hypot(realZ - rootReal, imagZ - rootImag);
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
    revise that code to this:

    ```js
    let realZ = xp;
    let imagZ = yp;

    // Perform a Newton's method approximation using `iterationsCount` rounds to find the
    // nearest root. If it gets close enough to a root, return it.
    for (let i = 0; i < iterationsCount; i++) {
        let sumReal = 0;
        let sumImag = 0;
        for (let i = 0; i < roots.length; i++) {
            let [rootReal, rootImag] = roots[i];
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

    for (let i = 0; i < roots.length; i++) {
        let [rootReal, rootImag] = roots[i];
        // JS has a `Math.hypot(x, y)` returning a more accurate form of `sqrt(x^2 + y^2)`
        let dst = hypot(realZ - rootReal, imagZ - rootImag);
        if (dst < minDistance) {
            minDistance = dst;
            closestRootId = i;
        }
    }
    return closestRootId;
    ```

    Then, I interchanged initial nested loop to be more CPU cache-friendly:
    https://stackoverflow.com/a/11413856. As `this.roots` is itself an array of arrays, this
    also means those entries are only read once per root array, decreasing pressure on the CPU
    cache as a result. This requires me to save `iterationsCount` partial sums to a local array,
    and I'll have to pay careful attention to how that array is accessed to ensure I actually
    derive that desired win with the CPU cache. (Essentially, it's solving it using a
    non-deterministic algorithm.)

    This code is the result of that last step.
    */

    // Fill reals with `xp` and imaginaries with `yp`.
    for (let j = 0; j < partialSums.length; j += 4) partialSums[j] = xp;
    for (let j = 2; j < partialSums.length; j += 4) partialSums[j] = yp;

    // Perform a Newton's method approximation using `iterationsCount` rounds to find the
    // nearest root. If it gets close enough to a root, return it.
    for (let i = 0; i < roots.length; i++) {
        const [rootReal, rootImag] = roots[i];

        for (let j = 0; j < partialSums.length; j += 2) {
            // Operations count for repeat cycle:
            // - 2 array loads
            // - 2 array stores
            // - 2 floating point additions
            // - 3 floating point subtractions
            // - 2 floating point multiplications
            // - 2 floating point divisions
            // - 1 floating point comparison

            let sumReal = partialSums[j + 0];
            let sumImag = partialSums[j + 1];

            let diffReal = sumReal - rootReal;
            let diffImag = sumImag - rootImag;

            // 1/(x + yi) = x/(x^2 + y^2) - (y/(x^2 + y^2))i
            // (a + bi) + 1/(x + yi) = (a + x/(x^2 + y^2)) + (b - y/(x^2 + y^2))i
            let squareNorm = diffReal * diffReal + diffImag * diffImag;
            
            // See the long comment above for an explanation of this.
            if (squareNorm < 0.000002) {
                return i;
            }

            sumReal += diffReal / squareNorm;
            sumImag -= diffImag / squareNorm;

            partialSums[j + 0] = sumReal;
            partialSums[j + 1] = sumImag;
        }
    }

    let resultReal = xp;
    let resultImag = yp;

    for (let j = 0; j < partialSums.length; j += 2) {
        let sumReal = partialSums[j + 0];
        let sumImag = partialSums[j + 1];
        // 1/(x + yi) = x/(x^2 + y^2) - (y/(x^2 + y^2))i
        // (a + bi) + 1/(x + yi) = (a + x/(x^2 + y^2)) + (b - y/(x^2 + y^2))i
        let squareNorm = sumReal * sumReal + sumImag * sumImag;
        resultReal -= sumReal / squareNorm;
        resultImag += sumImag / squareNorm;
    }

    // Failing a close-enough match, find and return the root with the nearest distance.
    let minDistance = Infinity;
    let closestRootId = 0;

    for (let i = 0; i < roots.length; i++) {
        let [rootReal, rootImag] = roots[i];
        let dst = Math.hypot(resultReal - rootReal, resultImag - rootImag);
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

    let totalSize = w_int * h_int;
    let thisBorder = calculatePartSize(totalSize, partsCount, partOffset, 1);
    let nextBorder = calculatePartSize(totalSize, partsCount, partOffset + 1, 1);

    let u32BufferView = new Uint32Array(buffer, bufferPtr);

    const partialSums = createPartialSums(iterationsCount);

    for (let i = thisBorder; i < nextBorder; i++) {
        let [xp, yp] = transformPointToPlotScale(i % w_int, i / w_int, plotScale);
        u32BufferView[i] = colorPacks[getRootId(partialSums, roots, xp, yp)];
    }
}
