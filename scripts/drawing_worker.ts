import init, { create_drawing_worker, DrawingConfig as DC, fill_pixels_js, fill_pixels_simd_js, PlotScale as PS } from '../pkg/newton_fractal.js';
import { fillPixelsJavascript } from './newtons_fractal.js';
import { PlotScale } from './plotter.js';

enum DrawingModes { 
    CpuWasmSimd = "CPU-wasm-simd",
    CpuWasmScalar = "CPU-wasm-scalar",
    CpuJsScalar = "CPU-js-scalar"
}

enum WorkerCommands {
    Init,
    Draw,
}

type DrawingConfig = {
    drawingMode: DrawingModes,
    plotScale: PlotScale,
    roots: number[][],
    iterationsCount: number,
    regionColors: number[][]
}

type DrawingResult = {
    drawingMode: DrawingModes,
    elapsedMs: number,
    imageData: ImageData
}

type WorkerMessage = {
    command: WorkerCommands,
    initSharedMemory?: WebAssembly.Memory,
    drawingConfig?: DrawingConfig,
}

type WorkerResult = {
    command: WorkerCommands,
    drawingResult?: DrawingResult
}

function draw(config: DrawingConfig): DrawingResult {
    let { plotScale, roots, drawingMode, iterationsCount, regionColors } = config;

    let length = plotScale.x_display_range * plotScale.y_display_range * 4;
    // let coresCount = navigator.hardwareConcurrency;
    let coresCount = 2;
    console.log('coresCount :>> ', coresCount);
    let step = Math.floor(length / coresCount);
    let data: Uint8ClampedArray = new Uint8ClampedArray(length);
    console.log('length :>> ', length);
    let sumLength = 0;
    let start: Date, end: Date;
    for (let i = 0; i < coresCount; i++) {
        let new_data: Uint8ClampedArray;
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

function postCustomMessage(message: WorkerResult) {
    postMessage(message, undefined);
}

let worker: Worker;
onmessage = async function (e: MessageEvent<WorkerMessage>) {
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
}

export {
    WorkerCommands,
    DrawingModes,
    DrawingConfig,
    DrawingResult,
    WorkerMessage,
    WorkerResult
}