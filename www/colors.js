let regionColors = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 0, 255], [255, 0, 255, 255], [0, 255, 255, 255]];
const DIM_COEFFICIENT = 1.25;
function DimColors(colors) {
    for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < 3; j++) {
            colors[i][j] = Math.round(colors[i][j] / DIM_COEFFICIENT);
        }
    }
}
DimColors(regionColors);
export { regionColors };
//# sourceMappingURL=colors.js.map