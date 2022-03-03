import init, { fill_pixels, fill_pixels_simd } from '../pkg/newton_fractal.js';
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
    let length = plotScale.x_display_range * plotScale.y_display_range * 4;
    let coresCount = navigator.hardwareConcurrency;
    console.log('coresCount :>> ', coresCount);
    let step = Math.floor(length / coresCount);
    let data = new Uint8ClampedArray(length);
    console.log('length :>> ', length);
    let start, end;
    for (let i = 0; i < coresCount; i++) {
        let new_data;
        const offset = step * i;
        switch (drawingMode) {
            case DrawingModes.CPU_JS_SCALAR:
                start = new Date();
                new_data = fillPixelsJavascript(plotScale, roots, iterationsCount, regionColors);
                end = new Date();
                break;
            case DrawingModes.CPU_WASM_SCALAR:
                start = new Date();
                new_data = fill_pixels(plotScale, roots, iterationsCount, regionColors, i, coresCount);
                end = new Date();
                break;
            case DrawingModes.CPU_WASM_SIMD:
                start = new Date();
                new_data = fill_pixels_simd(plotScale, roots, iterationsCount, regionColors);
                end = new Date();
                break;
            default:
                break;
        }
        console.log('new_data.length :>> ', new_data.length);
        console.log('offset :>> ', offset, ', step :>> ', step);
        for (let j = 0; j < new_data.length; j++) {
            data[j + offset] = new_data[j];
        }
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