const DIM_COEFFICIENT = 1.25;
function dimColors(colors) {
    let newColors = colors;
    for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < 3; j++) {
            newColors[i][j] = Math.round(colors[i][j] / DIM_COEFFICIENT);
        }
    }
    return newColors;
}
function generateShade() {
    return Math.round(Math.sqrt(Math.random() * Math.random() * Math.random()) * 255);
}
function generateColor() {
    const r = generateShade();
    const g = generateShade();
    const b = generateShade();
    return [r, g, b, 255];
}
export { dimColors, generateColor };
//# sourceMappingURL=colors.js.map