import init, { create_drawing_worker, DrawingConfig as DC, fill_pixels, fill_pixels_simd, PlotScale as PS } from '../pkg/newton_fractal.js';
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
    console.log('length :>> ', length);
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
                new_data = fill_pixels(plotScale, roots, iterationsCount, regionColors, i, coresCount);
                end = new Date();
                break;
            case DrawingModes.CpuWasmSimd:
                start = new Date();
                new_data = fill_pixels_simd(plotScale, roots, iterationsCount, regionColors);
                end = new Date();
                break;
            default:
                console.log(`UNKNOWN DRAWING MODE`);
                break;
        }
        console.log('new_data.length :>> ', new_data.length);
        for (let j = 0; j < new_data.length; j++) {
            data[j + sumLength] = new_data[j];
        }
        sumLength += new_data.length;
    }
    console.log(`Real length: ${length}, new data length: ${sumLength}`);
    let imageData = new ImageData(data, plotScale.x_display_range, plotScale.y_display_range);
    let elapsedMs = end.getTime() - start.getTime();
    return { drawingMode, elapsedMs, imageData };
}
function postCustomMessage(message) {
    postMessage(message, undefined);
}
let worker;
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
                worker = create_drawing_worker("./test.js");
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
                console.log('drawingConfig :>> ', drawingConfig);
                let ps = drawingConfig.plotScale;
                let plot_scale = new PS(ps.x_offset, ps.y_offset, ps.x_value_range, ps.y_value_range, ps.x_display_range, ps.y_display_range);
                let drawing_mode = Object.values(DrawingModes).indexOf(drawingConfig.drawingMode);
                console.log('drawing_mode :>> ', drawing_mode);
                let rustData = new DC(drawing_mode, plot_scale, new Float32Array(drawingConfig.roots.flat()), drawingConfig.iterationsCount, new Uint8Array(drawingConfig.regionColors.flat()));
                worker.postMessage(rustData);
            }
            break;
        default:
            break;
    }
};
export { WorkerCommands, DrawingModes };
//# sourceMappingURL=drawing_worker.js.map