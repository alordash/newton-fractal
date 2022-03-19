import { dimColors, generateColor } from "./colors.js";
let rgbDimmed = dimColors([
    [255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]
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
        colors: rgbDimmed
    };
};
const trianglePreset = () => {
    return {
        roots: [
            ...getPolygonPoints(1, 3)
        ],
        colors: [
            generateColor(),
            generateColor(),
            generateColor()
        ]
    };
};
const quadrilateralPreset = () => {
    return {
        roots: [
            [1, 0.6],
            [-1, -0.6],
            [-1, 0.6],
            [1, -0.6]
        ],
        colors: [
            [0, 204, 0, 255],
            [123, 157, 104, 255],
            [115, 74, 25, 255],
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
            [0, 0],
            ...getPolygonPoints(0.75, starPointersCount)
        ],
        colors: [
            generateColor(),
            ...shuffleArray(repeatArrayElements([
                ...rgbDimmed,
                ...dimColors([[255, 255, 0, 255]])
            ], starPointersCount, randomInt(3)))
        ]
    };
};
const fractalPresets = [
    defaultPreset,
    trianglePreset,
    quadrilateralPreset,
    starPreset
];
let startPresetId = 3;
let startPreset = fractalPresets[startPresetId]();
let roots = startPreset.roots;
let regionColors = startPreset.colors;
export { roots, regionColors };
//# sourceMappingURL=global_values.js.map