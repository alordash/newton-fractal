import { generateColor } from '../visuals/colors.js';
import { regionColors, roots } from '../visuals/fractal_presets.js';

const DEFAULT_X_RANGE = 4;
const DEFAULT_X_OFFSET = -2;

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
    static calculatePlotScale(innerWidth: number, innerHeight: number, x_offset?: number, x_range?: number, y_offset?: number, y_range?: number): PlotScale {
        const width = Math.round(innerWidth * 0.65);
        const height = Math.round(innerHeight * 0.75);
        const k = height / width;
        if (x_offset == undefined) {
            x_offset = DEFAULT_X_OFFSET;
        }
        if (y_offset == undefined) {
            y_offset = x_offset * k;
        }
        if (x_range == undefined) {
            x_range = DEFAULT_X_RANGE;
        }
        if (y_range == undefined) {
            y_range = x_range * k;
        }
        return new PlotScale(x_offset, y_offset, x_range, y_range, width, height);
    }
}

function addRoot(xMapped: number, yMapped: number) {
    roots.push([xMapped, yMapped]);
    console.log(`Added new root at: (${xMapped}, ${yMapped})`);
    if (regionColors.length < roots.length) {
        regionColors.push(generateColor());
    }
}

function getClosestRoot(xMapped: number, yMapped: number, plotScale: PlotScale) {
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
    return { id, dst: minDst * plotScale.x_display_range / plotScale.x_value_range };
}

export {
    PlotScale,
    addRoot,
    getClosestRoot,
}