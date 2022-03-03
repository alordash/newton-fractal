import init, { fill_pixels_nalgebra, fill_pixels_simd_nalgebra, fill_pixels } from '../pkg/newton_fractal.js';
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
    DrawingModes["CPU_WASM_SCALAR_PURE"] = "CPU-wasm-scalar-pure";
    DrawingModes["CPU_JS_SCALAR"] = "CPU-js-scalar";
})(DrawingModes || (DrawingModes = {}));
function draw(config) {
    let { plotScale, roots, drawingMode, iterationsCount, regionColors } = config;
    let data;
    let start, end;
    switch (drawingMode) {
        case DrawingModes.CPU_JS_SCALAR:
            start = new Date();
            data = fillPixelsJavascript(plotScale, roots, iterationsCount, regionColors);
            end = new Date();
            break;
        case DrawingModes.CPU_WASM_SCALAR:
            start = new Date();
            data = fill_pixels_nalgebra(plotScale, roots, iterationsCount, regionColors);
            end = new Date();
            break;
        case DrawingModes.CPU_WASM_SCALAR_PURE:
            start = new Date();
            data = fill_pixels(plotScale, roots, iterationsCount, regionColors);
            end = new Date();
            break;
        case DrawingModes.CPU_WASM_SIMD:
            start = new Date();
            data = fill_pixels_simd_nalgebra(plotScale, roots, iterationsCount, regionColors);
            end = new Date();
            break;
        default:
            break;
    }
    let imageData = new ImageData(data, plotScale.x_display_range, plotScale.y_display_range);
    let elapsedMs = end.getTime() - start.getTime();
    return { drawingMode, elapsedMs, imageData };
}
function postCustomMessage(message) {
    postMessage(message, undefined);
}
onmessage = async function (e) {
    let { data } = e;
    let { command } = data;
    switch (command) {
        case WorkerCommands.Init:
            {
                await init(undefined, data.initSharedMemory);
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