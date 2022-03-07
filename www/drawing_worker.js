import init, { DrawingConfig as DC, fill_pixels_js, fill_pixels_simd_js, PlotScale as PS } from '../pkg/newton_fractal.js';
import { fillPixelsJavascript } from './newtons_fractal.js';
var DrawingModes;
(function (DrawingModes) {
    DrawingModes["CpuWasmSimd"] = "CPU-wasm-simd";
    DrawingModes["CpuWasmScalar"] = "CPU-wasm-scalar";
    DrawingModes["CpuJsScalar"] = "CPU-js-scalar";
})(DrawingModes || (DrawingModes = {}));
var WorkerCommands;
(function (WorkerCommands) {
    WorkerCommands[WorkerCommands["Init"] = 0] = "Init";
    WorkerCommands[WorkerCommands["Draw"] = 1] = "Draw";
})(WorkerCommands || (WorkerCommands = {}));
function draw(config) {
    let { plotScale, roots, drawingMode, iterationsCount, regionColors } = config;
    let length = plotScale.x_display_range * plotScale.y_display_range * 4;
    let coresCount = 2;
    console.log('coresCount :>> ', coresCount);
    let step = Math.floor(length / coresCount);
    let data = new Uint8ClampedArray(length);
    let sumLength = 0;
    let start, end;
    for (let i = 0; i < coresCount; i++) {
        let new_data;
        switch (drawingMode) {
            case DrawingModes.CpuJsScalar:
                start = new Date();
                new_data = fillPixelsJavascript(plotScale, roots, iterationsCount, regionColors);
                end = new Date();
                break;
            case DrawingModes.CpuWasmScalar:
                start = new Date();
                new_data = fill_pixels_js(plotScale, roots, iterationsCount, regionColors, i, coresCount);
                end = new Date();
                break;
            case DrawingModes.CpuWasmSimd:
                start = new Date();
                new_data = fill_pixels_simd_js(plotScale, roots, iterationsCount, regionColors);
                end = new Date();
                break;
            default:
                console.log(`UNKNOWN DRAWING MODE`);
                break;
        }
        for (let j = 0; j < new_data.length; j++) {
            data[j + sumLength] = new_data[j];
        }
        sumLength += new_data.length;
    }
    let imageData = new ImageData(data, plotScale.x_display_range, plotScale.y_display_range);
    let elapsedMs = end.getTime() - start.getTime();
    return { drawingMode, elapsedMs, imageData };
}
function postCustomMessage(message) {
    postMessage(message, undefined);
}
const workersCount = navigator.hardwareConcurrency;
let workers = [];
let mod;
function testWorkerCallback(e) {
    console.log('Message from test worker :>> ', e.data);
}
function createDrawingWorker(uri, wasmMemory) {
    let worker = new Worker(uri, { type: 'module' });
    worker.onmessage = testWorkerCallback;
    worker.postMessage({ init: true, wasmMemory });
    console.log('new test worker :>> ', worker);
    return worker;
}
onmessage = async function (e) {
    let { data } = e;
    let { command } = data;
    console.log('JS WORKER got data :>> ', data);
    switch (command) {
        case WorkerCommands.Init:
            {
                mod = await init(undefined, data.initSharedMemory);
                postCustomMessage({
                    command
                });
                for (let i = 0; i < workersCount; i++) {
                    let worker = createDrawingWorker('./test.js', data.initSharedMemory);
                    workers.push(worker);
                }
                console.log('workersCount :>> ', workersCount);
                console.log('workers :>> ', workers);
            }
            break;
        case WorkerCommands.Draw:
            {
                let { drawingConfig } = data;
                let drawingResult = draw(drawingConfig);
                let ps = drawingConfig.plotScale;
                let plot_scale = new PS(ps.x_offset, ps.y_offset, ps.x_value_range, ps.y_value_range, ps.x_display_range, ps.y_display_range);
                let drawing_mode = Object.values(DrawingModes).indexOf(drawingConfig.drawingMode);
                for (let i = 0; i < 8; i++) {
                    let rustData = new DC(plot_scale, new Float32Array(drawingConfig.roots.flat()), drawingConfig.iterationsCount, new Uint8Array(drawingConfig.regionColors.flat()), i, workersCount);
                    console.log('rustData :>> ', rustData);
                    workers[i].postMessage(rustData);
                }
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