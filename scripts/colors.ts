let regionColors = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], /*[255, 255, 0, 255], [255, 0, 255, 255], [0, 255, 255, 255]*/];

const DIM_COEFFICIENT = 1.25;
function dimColors(colors: number[][]) {
    for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < 3; j++) {
            colors[i][j] = Math.round(colors[i][j] / DIM_COEFFICIENT);
        }
    }
}

function generateShade(): number {
    return Math.round(Math.sqrt(Math.random() * Math.random() * Math.random()) * 255);
}

function generateColor(): number[] {
    const r = generateShade();
    const g = generateShade();
    const b = generateShade();
    return [r, g, b, 255];
}

dimColors(regionColors);

export { dimColors, generateColor, regionColors };