import { generateColor, regionColors } from './colors.js';

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

    static calculatePlotScale(innerWidth: number, innerHeight: number): PlotScale {
        const width = Math.round(innerWidth * 0.65 / 4) * 4;
        const height = Math.round(innerHeight * 0.75);
        const k = height / width;
        const x_range = 4;
        const x_offset = -2;
        return new PlotScale(x_offset, x_offset * k, x_range, x_range * k, width, height);
    }
}

const startRoots = [[-0.5, -0.25], [-0.75, 0.25], [0, 0.5], [0.75, 0.25], [-0.85, 0.5]];
let roots: number[][] = startRoots;

function addRoot(xMapped: number, yMapped: number) {
    roots.push([xMapped, yMapped]);
    console.log(`Added new root at: (${xMapped}, ${yMapped})`);
    if (regionColors.length < roots.length) {
        regionColors.push(generateColor());
    }
}

export {
    PlotScale,
    roots,
    addRoot
}