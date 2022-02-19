import init, { Plotter, Polynomial } from '../pkg/newton_fractal.js';
import { generateColor, regionColors } from './colors.js';
import { calcDimension, fillPixelsJavascript } from './calculation.js';
const startRoots = [[-0.5, -0.25], [-0.75, 0.25], [0, 0.5], [0.75, 0.25], [-0.85, 0.5]];
var WorkerCommands;
(function (WorkerCommands) {
    WorkerCommands[WorkerCommands["Init"] = 0] = "Init";
    WorkerCommands[WorkerCommands["Draw"] = 1] = "Draw";
})(WorkerCommands || (WorkerCommands = {}));
var DrawingModes;
(function (DrawingModes) {
    DrawingModes["CPU_WASM_SIMD"] = "CPU-wasm-simd";
    DrawingModes["CPU_WASM_SCALAR"] = "CPU-wasm-scalar";
    DrawingModes["CPU_JS_SCALAR"] = "CPU-js-scalar";
})(DrawingModes || (DrawingModes = {}));
let plotter;
let polynom;
function addRoot(xMapped, yMapped) {
    console.log(`Added new root at: (${xMapped}, ${yMapped})`);
    polynom.add_root(xMapped, yMapped);
    if (regionColors.length < polynom.get_roots_count()) {
        regionColors.push(generateColor());
    }
}
function draw(config) {
    let { drawingMode, iterationsCount, regionColors } = config;
    let imageData;
    let start = new Date();
    switch (drawingMode) {
        case DrawingModes.CPU_JS_SCALAR:
            imageData = fillPixelsJavascript(plotter, polynom, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_WASM_SCALAR:
            imageData = plotter.fill_pixels_nalgebra(polynom, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_WASM_SIMD:
            imageData = plotter.fill_pixels_simd_nalgebra(polynom, iterationsCount, regionColors);
            break;
        default:
            break;
    }
    let end = new Date();
    let elapsedMs = end.getTime() - start.getTime();
    return { drawingMode, elapsedMs, imageData };
}
async function InitWasm(initConfig) {
    await init();
    let { innerWidth, innerHeight } = initConfig;
    let dimension = calcDimension(innerWidth, innerHeight);
    plotter = new Plotter(dimension);
    polynom = new Polynomial(startRoots);
}
function postCustomMessage(message) {
    postMessage(message);
}
onmessage = async function (e) {
    let { data } = e;
    let command = data.command;
    switch (command) {
        case WorkerCommands.Init:
            await InitWasm(data.initConfig);
            postCustomMessage({
                command
            });
            break;
        case WorkerCommands.Draw:
            let { drawingConfig } = data;
            let drawingResult = draw(drawingConfig);
            postCustomMessage({
                command,
                drawingResult
            });
            break;
        default:
            break;
    }
};
export { WorkerCommands, DrawingModes };
//# sourceMappingURL=drawing_worker.js.map