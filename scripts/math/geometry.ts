import { generateColor } from '../visuals/colors.js';
import { regionColors, roots } from '../visuals/fractal_presets.js';

const { newton_method_approx_wasm } = wasm_bindgen;

class PlotScale {
    x_offset: number;
    y_offset: number;
    x_value_range: number;
    y_value_range: number;
    x_display_range: number;
    y_display_range: number;

    constructor(
        x_offset: number,
        y_offset: number,
        x_value_range: number,
        y_value_range: number,
        x_display_range: number,
        y_display_range: number
    ) {
        this.x_offset = x_offset;
        this.y_offset = y_offset;
        this.x_value_range = x_value_range;
        this.y_value_range = y_value_range;
        this.x_display_range = x_display_range;
        this.y_display_range = y_display_range;
    }

    // Coefficients control canvas appearing size
    static calculatePlotScale(innerWidth: number, innerHeight: number): PlotScale {
        const width = Math.round(innerWidth * 0.65 / 4) * 4;
        const height = Math.round(innerHeight * 0.75);
        const k = height / width;
        const x_range = 4;
        const x_offset = -2;
        return new PlotScale(x_offset, x_offset * k, x_range, x_range * k, width, height);
    }
}

function addRoot(xMapped: number, yMapped: number) {
    roots.push([xMapped, yMapped]);
    console.log(`Added new root at: (${xMapped}, ${yMapped})`);
    if (regionColors.length < roots.length) {
        regionColors.push(generateColor());
    }
}

function getClosestRootFractalwise(xMapped: number, yMapped: number, iterationsCount: number) {
    let id = 0;
    let minDst = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < iterationsCount; i++) {
        let result = newton_method_approx_wasm(xMapped, yMapped, roots);
        let id = result[0];
        if (id < roots.length) {
            return { id, dst: 0 };
        }
        xMapped = result[1][0];
        yMapped = result[1][1];
    }

    for (let i = 0; i < roots.length; i++) {
        let [x, y] = roots[i];
        let [dx, dy] = [x - xMapped, y - yMapped];
        let dst = Math.sqrt(dx * dx + dy * dy);
        if (dst < minDst) {
            minDst = dst;
            id = i;
        }
    }
    return { id, dst: minDst };
}

function getClosestRoot(xMapped: number, yMapped: number) {
    let id = 0;
    let minDst = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < roots.length; i++) {
        let [x, y] = roots[i];
        let [dx, dy] = [x - xMapped, y - yMapped];
        let dst = Math.sqrt(dx * dx + dy * dy);
        if (dst < minDst) {
            minDst = dst;
            id = i;
        }
    }
    return { id, dst: minDst };
}

export {
    PlotScale,
    addRoot,
    getClosestRoot,
    getClosestRootFractalwise
}