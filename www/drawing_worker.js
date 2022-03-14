import init, { DrawingConfig as DC, fill_pixels_js, fill_pixels_simd_js, PlotScale as PS, create_image_buffer, free_image_buffer } from '../pkg/newton_fractal.js';
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
const workersCount = 4;
let workers = [];
let rustData = [];
let initialized = false;
let doneCount = 0;
let mod;
function testWorkerCallback(e) {
    let { id, data } = e.data;
    let drawingConfig = rustData[id];
    console.log('Message from test worker :>> ', e.data);
    console.log(`del rustData[${id}] :>> `, rustData[id]);
    doneCount++;
    console.log('doneCount :>> ', doneCount);
    if (doneCount == workersCount) {
        let { plot_scale, buffer_ptr } = drawingConfig;
        let { xDisplayRange: width, yDisplayRange: height } = plot_scale;
        console.log('buffer_ptr :>> ', buffer_ptr, "removing it's data with size: ", width * height);
        free_image_buffer(width, height, buffer_ptr);
        plot_scale.free();
    }
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
                if (initialized) {
                    doneCount = 0;
                    let ps = drawingConfig.plotScale;
                    let drawing_mode = Object.values(DrawingModes).indexOf(drawingConfig.drawingMode);
                    let plot_scale = new PS(ps.x_offset, ps.y_offset, ps.x_value_range, ps.y_value_range, ps.x_display_range, ps.y_display_range);
                    let image_data_buffer = create_image_buffer(ps.x_display_range, ps.y_display_range);
                    if (image_data_buffer == undefined) {
                        console.error("Error creating image buffer");
                    }
                    console.log('image_data_buffer :>> ', image_data_buffer);
                    for (let i = 0; i < workersCount; i++) {
                        rustData[i] = new DC(plot_scale, new Float32Array(drawingConfig.roots.flat()), drawingConfig.iterationsCount, new Uint8Array(drawingConfig.regionColors.flat()), i, workersCount, image_data_buffer);
                        console.log(`rustData[${i}] :>> `, rustData[i]);
                    }
                    for (let i = 0; i < workersCount; i++) {
                        workers[i].postMessage({ id: i, drawingConfig: rustData[i] });
                    }
                    plot_scale.free();
                }
                else {
                    initialized = true;
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