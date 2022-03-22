import { dimColors, generateColor } from "./colors.js";
let rgbyDimmed = dimColors([
    [255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 0, 255]
]);
function randomInt(max) {
    return Math.round(Math.random() * max);
}
function shuffleArray(array) {
    let newArray = array;
    for (let i = newArray.length - 1; i > 0; i--) {
        let j = Math.floor(randomInt(i));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
function repeatArrayElements(source, repeats, offset = 0) {
    let result = [];
    let sourceLength = source.length;
    offset = offset % sourceLength;
    for (let i = 0; i < repeats; i++) {
        result.push(source[offset]);
        offset = (offset + 1) % sourceLength;
    }
    return result;
}
function getPolygonPoints(radius, vertexCount, startAngleInRad = 0) {
    let roots = [];
    for (let i = 0; i < vertexCount; i++) {
        let angle = (startAngleInRad + 2 * Math.PI * i) / vertexCount;
        roots.push([
            radius * Math.cos(angle),
            radius * Math.sin(angle)
        ]);
    }
    return roots;
}
const defaultPreset = () => {
    return {
        roots: [
            [-0.5, -0.25],
            [-0.75, 0.25],
            [0, 0.5]
        ],
        colors: rgbyDimmed
    };
};
const trianglePreset = () => {
    return {
        roots: [
            ...getPolygonPoints(0.5 + 0.9 * Math.random(), 3)
        ],
        colors: repeatArrayElements(rgbyDimmed, 3, randomInt(2))
    };
};
const rectanglePreset = () => {
    return {
        roots: [
            [1.5, 0.9],
            [-1.5, -0.9],
            [-1.5, 0.9],
            [1.5, -0.9]
        ],
        colors: [
            generateColor(),
            [123, 157, 104, 255],
            generateColor(),
            [66, 12, 15, 255]
        ]
    };
};
const minStarPointersCount = 3;
const maxStarPointersCount = 5;
const starPreset = () => {
    const starPointersCount = minStarPointersCount + randomInt(maxStarPointersCount - minStarPointersCount);
    return {
        roots: [
            ...getPolygonPoints(0.75, starPointersCount, (5 + randomInt(4) * 40) * Math.PI / 180),
        ],
        colors: [
            ...shuffleArray(repeatArrayElements(rgbyDimmed, starPointersCount, randomInt(3)))
        ]
    };
};
const parabolaPreset = () => {
    const f = x => (4 * x * x - 2) / 1.2;
    let k = [-0.8, -0.5, 0.5, 0.8];
    let angle = randomInt(2) * Math.PI / 2;
    let cosa = Math.cos(angle);
    let sina = Math.sin(angle);
    let roots = k.map(x => [
        x * cosa - f(x) * sina,
        x * sina + f(x) * cosa
    ]);
    let colors = repeatArrayElements([...rgbyDimmed, generateColor()], 4, randomInt(3));
    return {
        roots,
        colors
    };
};
const fractalPresets = [
    defaultPreset,
];
let startPresetId = randomInt(fractalPresets.length - 1);
let startPreset = fractalPresets[startPresetId]();
let roots = startPreset.roots;
let regionColors = startPreset.colors;
function changePreset() {
    let startPresetId = randomInt(fractalPresets.length - 1);
    let startPreset = fractalPresets[startPresetId]();
    roots = startPreset.roots;
    regionColors = startPreset.colors;
}
export { roots, regionColors, changePreset };
//# sourceMappingURL=fractal_presets.js.map