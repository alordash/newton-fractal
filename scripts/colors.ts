let regionColors = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 0, 255], [255, 0, 255, 255], [0, 255, 255, 255]];

const DIM_COEFFICIENT = 1.25;
function DimColors(colors: number[][]) {
    for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < 3; j++) {
            colors[i][j] = Math.round(colors[i][j] / DIM_COEFFICIENT);
        }
    }
}

function GenerateShade(): number {
    return Math.round(Math.sqrt(Math.random() * Math.random() * Math.random()) * 255);
}

function GenerateColor(): number[] {
    const r = GenerateShade();
    const g = GenerateShade();
    const b = GenerateShade();
    return [r, g, b, 255];
}

DimColors(regionColors);

export { DimColors, GenerateColor, regionColors };