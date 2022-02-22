import init, { fill_pixels_nalgebra, fill_pixels_simd_nalgebra } from '../pkg/newton_fractal.js';
import { fillPixelsJavascript } from './newtons_fractal.js';
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
function draw(config) {
    let { plotScale, roots, drawingMode, iterationsCount, regionColors } = config;
    let imageData;
    let start = new Date();
    switch (drawingMode) {
        case DrawingModes.CPU_JS_SCALAR:
            imageData = fillPixelsJavascript(plotScale, roots, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_WASM_SCALAR:
            imageData = fill_pixels_nalgebra(plotScale, roots, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_WASM_SIMD:
            imageData = fill_pixels_simd_nalgebra(plotScale, roots, iterationsCount, regionColors);
            break;
        default:
            break;
    }
    let end = new Date();
    let elapsedMs = end.getTime() - start.getTime();
    return { drawingMode, elapsedMs, imageData };
}
function postCustomMessage(message) {
    postMessage(message);
}
onmessage = async function (e) {
    let { data } = e;
    let command = data.command;
    switch (command) {
        case WorkerCommands.Init:
            {
                await init();
                postCustomMessage({
                    command
                });
            }
            break;
        case WorkerCommands.Draw:
            {
                let { drawingConfig } = data;
                let drawingResult = draw(drawingConfig);
                postCustomMessage({
                    command,
                    drawingResult
                });
            }
            break;
        default:
            break;
    }
};
export { WorkerCommands, DrawingModes };
//# sourceMappingURL=drawing_worker.js.map